export function successResponse(data: any = null, message: string = 'success') {
  return { message, data };
}

export function errorResponse(
  statusCode: number,
  message: string = 'Internal server error',
) {
  return { statusCode, message };
}
