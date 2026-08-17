import { Body, Controller, HttpCode, Logger, Post, UnauthorizedException } from '@nestjs/common';

import {
  AuthenticateUserDto,
  AuthenticateUserResponseDto,
} from '@wendy/contracts';
import { Public } from '../../../shared/decorators/auth.decorators';
import { JwtService } from '../../../shared/jwt/jwt.service';
import { AuthenticateUserUseCase } from '../application/authenticate-user.use-case';

/**
 * Login endpoint. POST /oauth/token with username + password returns a long-lived JWT.
 */
@Controller('oauth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly jwtService: JwtService,
  ) {}

  @Post('token')
  @Public()
  @HttpCode(200)
  async token(@Body() dto: AuthenticateUserDto): Promise<AuthenticateUserResponseDto> {
    const user = await this.authenticateUserUseCase.signIn(
      dto.username,
      dto.password,
    );

    // Same generic error for "user not found" and "wrong password" — never leak which one failed.
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const accessToken = this.jwtService.signAccessToken({
      sub: user.id as any,
      role: user.role as any,
      tenantId: user.tenant_id as any,
      fullName: user.full_name,
      email: user.email,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 604800,
      user: {
        id: user.id as any,
        fullName: user.full_name,
        email: user.email,
        role: user.role as any,
        tenantId: user.tenant_id as any,
      },
    };
  }
}
