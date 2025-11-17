export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;
  public readonly name = 'FirestorePermissionError';
  public readonly serverError: any;

  constructor(context: SecurityRuleContext, serverError?: any) {
    const defaultMessage = `Firestore Security Rules denied a '${context.operation}' request on path '${context.path}'.`;
    super(defaultMessage);
    this.context = context;
    this.serverError = serverError;
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
