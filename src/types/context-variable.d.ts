import "hono";

type AuthPayload = {
  id: string;
  email: string;
};

declare module "hono" {
  interface ContextVariableMap {
    user: AuthPayload;
  }
}
