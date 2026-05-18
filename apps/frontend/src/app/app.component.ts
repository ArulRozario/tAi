import { Component, signal } from "@angular/core";
import { Router, RouterModule, NavigationEnd } from "@angular/router";
import { SidebarComponent } from "./layout/sidebar/sidebar.component";
import { ToastModule } from "primeng/toast";
import { filter } from "rxjs/operators";

const FULLPAGE_ROUTES = ['/workbench/', '/review/'];
const isFullPage = (url: string) => FULLPAGE_ROUTES.some(p => url.startsWith(p));
const isLogin    = (url: string) => url === '/login';

@Component({
    selector: 'app-container',
    imports: [RouterModule, SidebarComponent, ToastModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    currentUrl = signal(window.location.pathname);
    fullPage   = signal(isFullPage(window.location.pathname));
    loginPage  = signal(isLogin(window.location.pathname));

    constructor(router: Router) {
        router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
            const url = e.urlAfterRedirects as string;
            this.currentUrl.set(url);
            this.fullPage.set(isFullPage(url));
            this.loginPage.set(isLogin(url));
        });
    }
}
