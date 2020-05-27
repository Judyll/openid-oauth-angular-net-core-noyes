import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { AuthService } from './auth-service.component';
import { Constants } from '../constants';

@Injectable()
export class AuthInterceptorService implements HttpInterceptor {
    constructor(private _authService: AuthService) {}

    /**On of the reasons the Angular team deprecated the original http service from 
     * Angular 2 and replace it with the http client service is because the original 
     * service did not support an interception model. When making http calls from
     * client, you often need to have some custom codes that is invoked right before
     * a request goes out or right after a response comes back in, regardless of where
     * those calls are made in the application. In our case, what we want to do is add
     * the access token to the authorization header right before any called is made
     * to our APIs. The http client service enabled this using what is called the
     * http interceptor. This will add the access token to the request automatically
     * for all request.
     * Noticed the structure of this interceptor. It is part of handler pipeline 
     * architecture used by http client. So, when your intercept method gets invoked
     * by the http client when the request is being made, the request is passed in
     * as an HttpRequest object that you can inspect or modify before it goes out
     * to the wire. You will also passed the HttpHandler parameter which represents
     * the next piece of middleware in the pipeline. The expectation is you will do
     * what you need to do, and then invoked the 'next' handler. You can also block the
     * request from going out based on some criteria.
     * Once the interceptor is defined, we need to hooked it up to the Angular http client
     * infrastructure. This is done under app.module.ts. The way to do that is to go
     * to the NgModule where your interceptor is defined in the provider section of
     * the module.
     */
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        /**We should also consider if it is appropriate to blindly add access
         * token to any request going out from the app. We can't anticipate how 
         * the app will evolve over time and it's certainly possible or likely that
         * there maybe calls going out to other APIs besides our own. We don't want
         * to blindly add the access token to all calls going out but only on our
         * own API.
         */
        if (req.url.startsWith(Constants.apiRoot)) {
            /**We will return the result as a promise using .toPromise()
             * method since it's wrapped in a promise again and convert what comes
             * out of that into an observable using rxjs 'from' operator.
             */
            return from(this._authService.getAccessToken().then(token => {
                const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
                const authReq = req.clone({ headers });
                return next.handle(authReq).toPromise();
            }));   
        } else {
            return next.handle(req);
        }             
    }
}