import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/auth-service.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: []
})
export class AppComponent implements OnInit {
  isLoggedIn = false;

  constructor(private _authService: AuthService) {
    /** Event handler to update update the isLoggedIn property when
     * the logged in status changes
     */
    this._authService.loginChanged.subscribe((loggedIn: boolean) => {
      this.isLoggedIn = loggedIn;
    });
  }

  ngOnInit() {
    this._authService.isLoggedIn().then((loggedIn: boolean) => {
      this.isLoggedIn = loggedIn;
    });
  }
}
