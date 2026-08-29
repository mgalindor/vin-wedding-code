package com.vineyards.deerPlanner.shared.exceptions;

public class UserNotFoundException extends RuntimeException {

  public UserNotFoundException(String userId) {
    super("User not found: " + userId);
  }
}
