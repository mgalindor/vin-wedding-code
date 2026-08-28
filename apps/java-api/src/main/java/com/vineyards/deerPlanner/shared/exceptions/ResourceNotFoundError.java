package com.vineyards.deerPlanner.shared.exceptions;

public abstract class ResourceNotFoundError extends Exception {

  protected Object[] detailMessageArguments;

  public ResourceNotFoundError(String code, Object... detailMessageArguments) {
    super(code);
    this.detailMessageArguments = detailMessageArguments;
  }

  public ResourceNotFoundError(String code, Throwable cause, Object... detailMessageArguments) {
    super(code, cause);
    this.detailMessageArguments = detailMessageArguments;
  }

  public Object[] getDetailMessageArguments() {
    return detailMessageArguments;
  }
}
