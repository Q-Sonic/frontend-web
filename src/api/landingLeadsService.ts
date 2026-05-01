import { api } from './client';
import type { ApiResponse } from '../types';

export type LandingLeadInquiryType = 'artist' | 'client';

export type SubmitLandingLeadPayload = {
  fullName: string;
  email: string;
  inquiryType?: LandingLeadInquiryType;
};

export async function submitLandingLead(payload: SubmitLandingLeadPayload): Promise<ApiResponse<{ id: string }>> {
  return api<ApiResponse<{ id: string }>>('landing-leads', {
    method: 'POST',
    body: JSON.stringify({
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      inquiryType: payload.inquiryType,
    }),
  });
}
