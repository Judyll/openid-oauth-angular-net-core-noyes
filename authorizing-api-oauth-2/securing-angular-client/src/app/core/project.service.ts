import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Constants } from '../constants';
import { Milestone } from '../model/milestone';
import { MilestoneStatus } from '../model/milestone-status';
import { Project } from '../model/project';
import { UserPermission } from '../model/user-permission';
import { UserProfile } from '../model/user-profile';
import { CoreModule } from './core.module';
import { AuthService } from './auth-service.component';


@Injectable()
export class ProjectService {
    constructor(private _httpClient: HttpClient,
        private _authService: AuthService) { }

    /** To fix the 401 code error, we just need to pass the access token to the API
     * following the OAuth 2 specs which specifies that you should pass the token
     * in the authorization header with the prefix of "Bearer". In Angular, we have
     * many ways to do this. The simplest is to manual adding the header to the outgoing
     * http request when you make it through the httpclient. 
     */
    getProjects(): Observable<Project[]> {
        /**From the promise handler of the 'getAccessToken' call, we will be using the 
         * 'from' operator from rxjs to convert the results back into an observable
         * what we can return  */
        return from(
            /**Call the getAccessToken and once that promise produces the access token, we can
             * construct an HttpHeaders object and call the set method to set the authorization
             * header to a value of bearer <space> and the token value
             */
            this._authService.getAccessToken().then(token => {
                const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
                /**We still need to return an observable of projects array. To do that we need to
                 * call .toPromise method to convert the observable from the http call into a promise
                 */
                return this._httpClient.get<Project[]>(Constants.apiRoot +
                    'Projects', { headers: headers }).toPromise();
            }));
    }

    getProject(projectId: number): Observable<Project> {
        return this._httpClient.get<Project>(Constants.apiRoot + 'Projects/' + projectId);
    }

    getProjectUsers(projectId: number): Observable<UserProfile[]> {
        return this._httpClient.get<UserProfile[]>(Constants.apiRoot + 'Projects/' + projectId + '/Users');
    }

    addProject(project: Project): Observable<Project> {
        return this._httpClient.post<Project>(Constants.apiRoot + 'Projects', project);
    }

    deleteProject(project: Project): Observable<object> {
        return this._httpClient.delete(Constants.apiRoot + 'Projects/' + project.id);
    }

    addUserPermission(userPermission: UserPermission) {
        return this._httpClient.post(Constants.apiRoot + 'UserPermissions', userPermission);
    }

    removeUserPermission(userId: string, projectId: number) {
        return this._httpClient.delete(`${Constants.apiRoot}UserPermissions/?userId=${userId}&projectId=${projectId}`);
    }

    updateUserPermission(userPermission) {
        return this._httpClient.put(`${Constants.apiRoot}UserPermissions`, userPermission);
    }

    getMilestones(projectId: number): Observable<Milestone[]> {
        return this._httpClient.get<Milestone[]>(Constants.apiRoot + 'Milestone');
    }

    getMilestoneStatuses() {
        return this._httpClient.get<MilestoneStatus[]>(`${Constants.apiRoot}Projects/MilestoneStatuses`);
    }

    addMilestone(milestone: Milestone) {
        return this._httpClient.post(`${Constants.apiRoot}Projects/Milestones`, milestone);
    }

    deleteMilestone(id: number) {
        return this._httpClient.delete(`${Constants.apiRoot}Projects/Milestones/${id}`);
    }

    updateMilestone(milestone: Milestone) {
        return this._httpClient.put(`${Constants.apiRoot}Projects/Milestones/${milestone.id}`, milestone);
    }
}