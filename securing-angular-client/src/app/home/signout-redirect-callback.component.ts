import { Component, OnInit } from '@angular/core';
import { AuthService } from '../core/auth-service.component';
import { Router } from '@angular/router';

@Component({
    selector: 'app-signout-callback',
    template: `<p>Signing out...</p>`
})

export class SignoutRedirectCallbackComponent implements OnInit {
    constructor(private _authService: AuthService,
        private _router: Router) { }

    ngOnInit() {
        this._authService.completeLogout().then(() => {
            this._router.navigate(["/"], { replaceUrl: true });
        });
     }
}