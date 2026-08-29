package com.vineyards.deerPlanner.invitation.domain;

import lombok.Builder;
import lombok.Data;

@Data
@Builder(toBuilder = true)
public class RsvpResponse {
  private String status;
  private String message;

  public static RsvpResponse thankYou() {
    return RsvpResponse.builder()
        .status("thankYou")
        .message("Gracias por confirmar tu asistencia.")
        .build();
  }

  public static RsvpResponse failed(String message) {
    return RsvpResponse.builder().status("failed").message(message).build();
  }
}
