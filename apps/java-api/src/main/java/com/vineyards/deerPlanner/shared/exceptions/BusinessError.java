package com.vineyards.deerPlanner.shared.exceptions;

public class BusinessError extends RuntimeException {

  protected Object[] detailMessageArguments;

  public BusinessError(String code, Object... detailMessageArguments) {
    super(code);
    this.detailMessageArguments = detailMessageArguments;
  }

  public BusinessError(String code, Throwable cause, Object... detailMessageArguments) {
    super(code, cause);
    this.detailMessageArguments = detailMessageArguments;
  }

  public Object[] getDetailMessageArguments() {
    return detailMessageArguments;
  }
}
