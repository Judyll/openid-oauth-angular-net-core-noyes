import { Component, OnInit } from '@angular/core';
import { AuthService } from '../core/auth-service.component';
import { Router } from '@angular/router';

@Component({
    selector: 'app-signin-callback',
    template: `<p>Signing in...</p>`
})

export class SigninRedirectCallbackComponent implements OnInit {
    constructor(private _authService: AuthService,
        private _router: Router) { }

    ngOnInit() { 
        /** Invokes the completelogin method in the _authService. On the completion of the 
         * promise, we can navigate to some other view. We can ignore the 'user' that is
         * returned from promise because the _authService and UserManager already cached
         * and this view does not need to do anything with it. In the promise handler, we will
         * just navigate to the root view and use replaceUrl options and set it to true
         * to remove SigninRedirectCallbackComponent from the back navigation stack.
        */
        this._authService.completeLogin().then(() => {
            this._router.navigate(["/"], { replaceUrl: true });
        });
    }
}