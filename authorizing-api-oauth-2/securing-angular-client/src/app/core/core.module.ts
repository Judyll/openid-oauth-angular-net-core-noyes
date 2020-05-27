import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptorService } from './auth-interceptor.service';
import { AccountService } from './account.service';
import { AuthService } from './auth-service.component';
import { ProjectService } from './project.service';

@NgModule({
    imports: [],
    exports: [],
    declarations: [],
    providers: [
        AccountService,
        AuthService,
        ProjectService,
        /**We are adding the HTTP_INTERCEPTORS object from Angular, set the 
         * useClass property to your interceptor class the multi property
         * to true so that you can hook up other interceptors elsewhere
         * in your app.
         */
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true }
    ],
})
export class CoreModule { }
