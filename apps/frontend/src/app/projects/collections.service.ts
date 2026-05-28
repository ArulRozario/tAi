import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CollectionNode {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  children: CollectionNode[];
  _count: { projects: number };
}

export interface CreateCollectionDto {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  orderIndex?: number;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
  orderIndex?: number;
}

@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/collections';

  /** Full tree — pass rootId to get a sub-tree. */
  getTree(rootId?: string): Observable<CollectionNode[]> {
    const params = rootId ? `?rootId=${rootId}` : '';
    return this.http.get<CollectionNode[]>(`${this.apiUrl}${params}`);
  }

  getOne(id: string): Observable<CollectionNode> {
    return this.http.get<CollectionNode>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCollectionDto): Observable<CollectionNode> {
    return this.http.post<CollectionNode>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateCollectionDto): Observable<CollectionNode> {
    return this.http.patch<CollectionNode>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Move a project into a collection, or remove it from any collection (null). */
  assignProject(projectId: string, collectionId: string | null): Observable<any> {
    return this.http.patch(`${this.apiUrl}/projects/${projectId}/assign`, {
      collectionId,
    });
  }

  /** Flatten a tree into a depth-labelled list (for dropdowns). */
  flattenTree(
    nodes: CollectionNode[],
    depth = 0,
  ): Array<CollectionNode & { depth: number }> {
    const result: Array<CollectionNode & { depth: number }> = [];
    for (const node of nodes) {
      result.push({ ...node, depth });
      if (node.children.length > 0) {
        result.push(...this.flattenTree(node.children, depth + 1));
      }
    }
    return result;
  }
}
