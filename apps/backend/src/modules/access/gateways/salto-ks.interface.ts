export interface SaltoUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface SaltoAccessGroup {
  id: string;
  name: string;
  doorIds: string[];
}

export interface SaltoKey {
  id: string;
  userId: string;
  status: string;
  validFrom: Date;
  validUntil?: Date;
}

export interface SaltoEvent {
  id: string;
  doorId: string;
  userId?: string;
  method: string;
  direction: string;
  granted: boolean;
  timestamp: Date;
}

export interface ISaltoKsGateway {
  // User management
  createUser(
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<SaltoUser>;
  deleteUser(saltoUserId: string): Promise<void>;

  // Key management
  issueKey(
    userId: string,
    accessGroupId: string,
    validFrom: Date,
    validUntil?: Date,
  ): Promise<SaltoKey>;
  revokeKey(keyId: string): Promise<void>;
  updateKeyValidity(
    keyId: string,
    validFrom: Date,
    validUntil?: Date,
  ): Promise<SaltoKey>;

  // Access groups
  listAccessGroups(): Promise<SaltoAccessGroup[]>;
  getAccessGroup(groupId: string): Promise<SaltoAccessGroup>;

  // Events / Logs
  getRecentEvents(since: Date, limit?: number): Promise<SaltoEvent[]>;
}
