import { Component, signal } from "@angular/core";
import { Router, RouterModule, NavigationEnd } from "@angular/router";
import { SidebarComponent } from "./layout/sidebar/sidebar.component";
import { ToastModule } from "primeng/toast";
import { filter } from "rxjs/operators";

const isLogin = (url: string) => url === '/login';

@Component({
    selector: 'app-container',
    imports: [RouterModule, SidebarComponent, ToastModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    loginPage = signal(isLogin(window.location.pathname));

    constructor(router: Router) {
        router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
            this.loginPage.set(isLogin(e.urlAfterRedirects as string));
        });
    }
}
