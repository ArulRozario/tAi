import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SidebarComponent } from "./layout/sidebar/sidebar.component";
import { ToastModule } from "primeng/toast";

@Component({
    selector: 'app-container',
    imports: [RouterModule, SidebarComponent, ToastModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    currentUrl = window.location.pathname;
}   