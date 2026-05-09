export interface Customer {
  id: number;
  name: string;
  email: string;
}

export interface CustomerSummary {
  id: number;
  name: string;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
}

export interface UpdateCustomerRequest {
  name: string;
  email: string;
}
