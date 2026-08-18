import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuthenticateUserDto,
  AuthenticateUserResponseDto,
} from '@wendy/contracts';
import type { UserProfileDto } from '@wendy/contracts';

import { Public } from '../../../shared/decorators/auth.decorators';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../shared/decorators/current-user.decorator';
import { JwtService } from '../../../shared/jwt/jwt.service';
import { IdentityService } from '../application/identity.service';

@Controller('oauth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly identityService: IdentityService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('token')
  @Public()
  @HttpCode(200)
  async token(@Body() dto: AuthenticateUserDto): Promise<AuthenticateUserResponseDto> {
    const user = await this.identityService.authenticate(
      dto.username,
      dto.password,
    );

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
      expires_in: 3600,
    };
  }

  @Get('userinfo')
  async userinfo(@CurrentUser() caller: AuthenticatedUser): Promise<UserProfileDto> {
    return this.identityService.findProfile(caller.id);
  }
}
