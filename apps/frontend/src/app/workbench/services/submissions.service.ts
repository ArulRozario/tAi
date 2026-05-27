import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReviewSubmission {
  id: string;
  pageId: string;
  submittedById: string;
  submittedBy: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string | null;
  rejectedAt?: string | null;
  rejectedById?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ReviewSubmissionItem[];
  itemCount?: number;
}

export interface ReviewSubmissionItem {
  id: string;
  submissionId: string;
  segmentId: string;
  editedText: string;
  createdAt: string;
}

export interface SegmentReviewCorrection {
  submissionId: string;
  status: string;
  submittedBy: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  editedText: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SubmissionsService {
  private http = inject(HttpClient);
  private base = '/api/v1/pages';

  /** Submit the current user's working edits as a new submission */
  submitReview(pageId: string, notes?: string): Observable<ReviewSubmission> {
    return this.http.post<ReviewSubmission>(`${this.base}/${pageId}/review-submissions`, { notes });
  }

  /** List submissions for a page */
  getSubmissions(pageId: string, status?: string): Observable<{ data: ReviewSubmission[] }> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<{ data: ReviewSubmission[] }>(`${this.base}/${pageId}/review-submissions`, { params });
  }

  /** Get all corrections for a specific segment */
  getSegmentCorrections(pageId: string, segmentId: string): Observable<{ data: SegmentReviewCorrection[] }> {
    return this.http.get<{ data: SegmentReviewCorrection[] }>(
      `${this.base}/${pageId}/review-submissions/segment/${segmentId}`
    );
  }

  /** Approve a submission */
  approveSubmission(pageId: string, submissionId: string, notes?: string): Observable<ReviewSubmission> {
    return this.http.post<ReviewSubmission>(
      `${this.base}/${pageId}/review-submissions/${submissionId}/approve`,
      { notes }
    );
  }

  /** Reject a submission */
  rejectSubmission(pageId: string, submissionId: string, reason?: string): Observable<ReviewSubmission> {
    return this.http.post<ReviewSubmission>(
      `${this.base}/${pageId}/review-submissions/${submissionId}/reject`,
      { reason }
    );
  }

  /** Unsubmit (withdraw) a submission */
  unsubmitReview(pageId: string, submissionId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/${pageId}/review-submissions/${submissionId}/unsubmit`,
      {}
    );
  }
}
