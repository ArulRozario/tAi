import { Component, inject, signal } from "@angular/core";
import { Router, RouterModule, NavigationEnd } from "@angular/router";
import { SidebarComponent } from "./layout/sidebar/sidebar.component";
import { ToastModule } from "primeng/toast";
import { LayoutService } from "./layout.service";
import { filter } from "rxjs/operators";

const isLogin = (url: string) => url === '/login';
const isFullPage = (url: string) => /^\/(workbench|review)\//.test(url);

@Component({
    selector: 'app-container',
    imports: [RouterModule, SidebarComponent, ToastModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    layout    = inject(LayoutService);
    loginPage = signal(isLogin(window.location.pathname));
    fullPage  = signal(isFullPage(window.location.pathname));

    constructor(router: Router) {
        router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
            const url = e.urlAfterRedirects as string;
            this.loginPage.set(isLogin(url));
            this.fullPage.set(isFullPage(url));
            // Close mobile drawer on navigation
            this.layout.closeMobileMenu();
        });
    }
}
