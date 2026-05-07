import {
  Tooltip,
  TooltipModule
} from "./chunk-KSU7JJX6.js";
import {
  zindexutils
} from "./chunk-ED3PZLAC.js";
import {
  MotionDirective,
  MotionModule
} from "./chunk-32VNQT4T.js";
import {
  ButtonDirective
} from "./chunk-YQ3YB2XB.js";
import {
  AutoFocus
} from "./chunk-2KXB3FJ5.js";
import "./chunk-L4W5WIUE.js";
import {
  ConnectedOverlayScrollHandler
} from "./chunk-L6NMCORA.js";
import {
  AngleRightIcon,
  ChevronDownIcon
} from "./chunk-O4XY33QG.js";
import {
  Ripple
} from "./chunk-PGPZQIZX.js";
import "./chunk-AHZN2VNN.js";
import {
  BaseComponent,
  Bind,
  BindModule,
  PARENT_INSTANCE
} from "./chunk-RDGPVRJM.js";
import {
  BaseStyle
} from "./chunk-YMFEJ3C6.js";
import {
  RouterLink,
  RouterLinkActive,
  RouterModule
} from "./chunk-6SGC2H3T.js";
import "./chunk-PAF3F7MU.js";
import "./chunk-NYIWN2UG.js";
import "./chunk-C3L7JQTT.js";
import {
  D,
  I,
  J,
  M,
  OverlayService,
  PrimeTemplate,
  S,
  SharedModule,
  Yt,
  bt,
  l,
  m,
  s2 as s,
  s3 as s2,
  ut,
  v,
  z,
  zt
} from "./chunk-6X4SBNEN.js";
import {
  CommonModule,
  NgForOf,
  NgIf,
  NgStyle,
  NgTemplateOutlet,
  isPlatformBrowser
} from "./chunk-SO6KPK33.js";
import "./chunk-4FSBW6TR.js";
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  Inject,
  Injectable,
  Input,
  NgModule,
  Output,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
  booleanAttribute,
  input,
  numberAttribute,
  setClassMetadata,
  ɵɵHostDirectivesFeature,
  ɵɵInheritDefinitionFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵariaProperty,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵconditionalCreate,
  ɵɵcontentQuery,
  ɵɵdefineComponent,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵgetInheritedFactory,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵsanitizeHtml,
  ɵɵsanitizeUrl,
  ɵɵstyleMap,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵviewQuery
} from "./chunk-MEPECJH5.js";
import {
  EventEmitter,
  InjectionToken,
  computed,
  effect,
  forwardRef,
  inject,
  signal,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵnamespaceSVG,
  ɵɵresetView,
  ɵɵrestoreView
} from "./chunk-BDTBJ5A5.js";
import "./chunk-BGJDQHGH.js";
import "./chunk-FX47LQWG.js";
import "./chunk-KHPDHDQC.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-GOMI4DH3.js";

// node_modules/.pnpm/@primeuix+styles@2.0.3/node_modules/@primeuix/styles/dist/tieredmenu/index.mjs
var style = "\n    .p-tieredmenu {\n        background: dt('tieredmenu.background');\n        color: dt('tieredmenu.color');\n        border: 1px solid dt('tieredmenu.border.color');\n        border-radius: dt('tieredmenu.border.radius');\n        min-width: 12.5rem;\n    }\n    \n\n    .p-tieredmenu-root-list,\n    .p-tieredmenu-submenu {\n        margin: 0;\n        padding: dt('tieredmenu.list.padding');\n        list-style: none;\n        outline: 0 none;\n        display: flex;\n        flex-direction: column;\n        gap: dt('tieredmenu.list.gap');\n    }\n\n    .p-tieredmenu-submenu {\n        position: absolute;\n        min-width: 100%;\n        z-index: 1;\n        background: dt('tieredmenu.background');\n        color: dt('tieredmenu.color');\n        border: 1px solid dt('tieredmenu.border.color');\n        border-radius: dt('tieredmenu.border.radius');\n        box-shadow: dt('tieredmenu.shadow');\n    }\n\n    .p-tieredmenu-item {\n        position: relative;\n    }\n\n    .p-tieredmenu-item-content {\n        transition:\n            background dt('tieredmenu.transition.duration'),\n            color dt('tieredmenu.transition.duration');\n        border-radius: dt('tieredmenu.item.border.radius');\n        color: dt('tieredmenu.item.color');\n    }\n\n    .p-tieredmenu-item-link {\n        cursor: pointer;\n        display: flex;\n        align-items: center;\n        text-decoration: none;\n        overflow: hidden;\n        position: relative;\n        color: inherit;\n        padding: dt('tieredmenu.item.padding');\n        gap: dt('tieredmenu.item.gap');\n        user-select: none;\n        outline: 0 none;\n    }\n\n    .p-tieredmenu-item-label {\n        line-height: 1;\n    }\n\n    .p-tieredmenu-item-icon {\n        color: dt('tieredmenu.item.icon.color');\n    }\n\n    .p-tieredmenu-submenu-icon {\n        color: dt('tieredmenu.submenu.icon.color');\n        margin-left: auto;\n        font-size: dt('tieredmenu.submenu.icon.size');\n        width: dt('tieredmenu.submenu.icon.size');\n        height: dt('tieredmenu.submenu.icon.size');\n    }\n\n    .p-tieredmenu-submenu-icon:dir(rtl) {\n        margin-left: 0;\n        margin-right: auto;\n    }\n\n    .p-tieredmenu-item.p-focus > .p-tieredmenu-item-content {\n        color: dt('tieredmenu.item.focus.color');\n        background: dt('tieredmenu.item.focus.background');\n    }\n\n    .p-tieredmenu-item.p-focus > .p-tieredmenu-item-content .p-tieredmenu-item-icon {\n        color: dt('tieredmenu.item.icon.focus.color');\n    }\n\n    .p-tieredmenu-item.p-focus > .p-tieredmenu-item-content .p-tieredmenu-submenu-icon {\n        color: dt('tieredmenu.submenu.icon.focus.color');\n    }\n\n    .p-tieredmenu-item:not(.p-disabled) > .p-tieredmenu-item-content:hover {\n        color: dt('tieredmenu.item.focus.color');\n        background: dt('tieredmenu.item.focus.background');\n    }\n\n    .p-tieredmenu-item:not(.p-disabled) > .p-tieredmenu-item-content:hover .p-tieredmenu-item-icon {\n        color: dt('tieredmenu.item.icon.focus.color');\n    }\n\n    .p-tieredmenu-item:not(.p-disabled) > .p-tieredmenu-item-content:hover .p-tieredmenu-submenu-icon {\n        color: dt('tieredmenu.submenu.icon.focus.color');\n    }\n\n    .p-tieredmenu-item-active > .p-tieredmenu-item-content {\n        color: dt('tieredmenu.item.active.color');\n        background: dt('tieredmenu.item.active.background');\n    }\n\n    .p-tieredmenu-item-active > .p-tieredmenu-item-content .p-tieredmenu-item-icon {\n        color: dt('tieredmenu.item.icon.active.color');\n    }\n\n    .p-tieredmenu-item-active > .p-tieredmenu-item-content .p-tieredmenu-submenu-icon {\n        color: dt('tieredmenu.submenu.icon.active.color');\n    }\n\n    .p-tieredmenu-separator {\n        border-block-start: 1px solid dt('tieredmenu.separator.border.color');\n    }\n\n    .p-tieredmenu-overlay {\n        box-shadow: dt('tieredmenu.shadow');\n        will-change: transform;\n    }\n\n    .p-tieredmenu-mobile .p-tieredmenu-submenu {\n        position: static;\n        box-shadow: none;\n        border: 0 none;\n        padding-inline-start: dt('tieredmenu.submenu.mobile.indent');\n        padding-inline-end: 0;\n    }\n\n    .p-tieredmenu-mobile .p-tieredmenu-submenu:dir(rtl) {\n        padding-inline-start: 0;\n        padding-inline-end: dt('tieredmenu.submenu.mobile.indent');\n    }\n\n    .p-tieredmenu-mobile .p-tieredmenu-submenu-icon {\n        transition: transform 0.2s;\n        transform: rotate(90deg);\n    }\n\n    .p-tieredmenu-mobile .p-tieredmenu-item-active > .p-tieredmenu-item-content .p-tieredmenu-submenu-icon {\n        transform: rotate(-90deg);\n    }\n";

// node_modules/.pnpm/primeng@21.1.6_3dc8455f034b4170dd0602a69855ad24/node_modules/primeng/fesm2022/primeng-tieredmenu.mjs
var _c0 = ["sublist"];
var _c1 = (a0) => ({
  processedItem: a0
});
var _c2 = () => ({
  exact: false
});
var _c3 = (a0, a1) => ({
  $implicit: a0,
  hasSubmenu: a1
});
function TieredMenuSub_Conditional_0_ng_template_2_li_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "li", 8);
  }
  if (rf & 2) {
    const processedItem_r3 = ɵɵnextContext().$implicit;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵstyleMap(ctx_r1.getItemProp(processedItem_r3, "style"));
    ɵɵclassMap(ctx_r1.cn(ctx_r1.cx("separator"), ctx_r1.getItemProp(processedItem_r3, "class"), ctx_r1.getItemProp(processedItem_r3, "styleClass")));
    ɵɵproperty("pBind", ctx_r1._ptm("separator"));
    ɵɵattribute("id", ctx_r1.getItemId(processedItem_r3));
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_span_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 19);
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(4);
    const processedItem_r3 = ctx_r4.$implicit;
    const index_r6 = ctx_r4.index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.cn(ctx_r1.cx("itemIcon"), ctx_r1.getItemProp(processedItem_r3, "icon"), ctx_r1.getItemProp(processedItem_r3, "iconClass")));
    ɵɵproperty("ngStyle", ctx_r1.getItemProp(processedItem_r3, "iconStyle"))("pBind", ctx_r1.getPTOptions(processedItem_r3, index_r6, "itemIcon"));
    ɵɵattribute("tabindex", -1);
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_span_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 19);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(4);
    const processedItem_r3 = ctx_r4.$implicit;
    const index_r6 = ctx_r4.index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.cn(ctx_r1.cx("itemLabel"), ctx_r1.getItemProp(processedItem_r3, "labelClass")));
    ɵɵproperty("ngStyle", ctx_r1.getItemProp(processedItem_r3, "labelStyle"))("pBind", ctx_r1.getPTOptions(processedItem_r3, index_r6, "itemLabel"));
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r1.getItemLabel(processedItem_r3), " ");
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 20);
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(4);
    const processedItem_r3 = ctx_r4.$implicit;
    const index_r6 = ctx_r4.index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.cn(ctx_r1.cx("itemLabel"), ctx_r1.getItemProp(processedItem_r3, "labelClass")));
    ɵɵproperty("ngStyle", ctx_r1.getItemProp(processedItem_r3, "labelStyle"))("innerHTML", ctx_r1.getItemLabel(processedItem_r3), ɵɵsanitizeHtml)("pBind", ctx_r1.getPTOptions(processedItem_r3, index_r6, "itemLabel"));
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_span_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span");
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const processedItem_r3 = ɵɵnextContext(4).$implicit;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.cn(ctx_r1.cx("itemBadge"), ctx_r1.getItemProp(processedItem_r3, "badgeStyleClass")));
    ɵɵadvance();
    ɵɵtextInterpolate(ctx_r1.getItemProp(processedItem_r3, "badge"));
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_ng_container_6__svg_svg_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵnamespaceSVG();
    ɵɵelement(0, "svg", 23);
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(5);
    const processedItem_r3 = ctx_r4.$implicit;
    const index_r6 = ctx_r4.index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.cx("submenuIcon"));
    ɵɵproperty("pBind", ctx_r1.getPTOptions(processedItem_r3, index_r6, "submenuIcon"));
    ɵɵattribute("aria-hidden", true);
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_ng_container_6_2_ng_template_0_Template(rf, ctx) {
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_ng_container_6_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_ng_container_6_2_ng_template_0_Template, 0, 0, "ng-template", 24);
  }
  if (rf & 2) {
    ɵɵariaProperty("aria-hidden", true);
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_ng_container_6__svg_svg_1_Template, 1, 4, "svg", 21)(2, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_ng_container_6_2_Template, 1, 1, null, 22);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(6);
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r1.tieredMenu.submenuIconTemplate && !ctx_r1.tieredMenu._submenuIconTemplate);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r1.tieredMenu.submenuIconTemplate || ctx_r1.tieredMenu._submenuIconTemplate);
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "a", 15);
    ɵɵtemplate(1, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_span_1_Template, 1, 5, "span", 16)(2, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_span_2_Template, 2, 5, "span", 17)(3, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_ng_template_3_Template, 1, 5, "ng-template", null, 2, ɵɵtemplateRefExtractor)(5, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_span_5_Template, 2, 3, "span", 18)(6, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_ng_container_6_Template, 3, 2, "ng-container", 11);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const htmlLabel_r7 = ɵɵreference(4);
    const ctx_r4 = ɵɵnextContext(3);
    const processedItem_r3 = ctx_r4.$implicit;
    const index_r6 = ctx_r4.index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.cn(ctx_r1.cx("itemLink"), ctx_r1.getItemProp(processedItem_r3, "linkClass")));
    ɵɵproperty("target", ctx_r1.getItemProp(processedItem_r3, "target"))("ngStyle", ctx_r1.getItemProp(processedItem_r3, "linkStyle"))("pBind", ctx_r1.getPTOptions(processedItem_r3, index_r6, "itemLink"));
    ɵɵattribute("href", ctx_r1.getItemProp(processedItem_r3, "url"), ɵɵsanitizeUrl)("data-automationid", ctx_r1.getItemProp(processedItem_r3, "automationId"))("title", ctx_r1.getItemProp(processedItem_r3, "title"))("tabindex", -1);
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.getItemProp(processedItem_r3, "icon"));
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.getItemProp(processedItem_r3, "escape"))("ngIfElse", htmlLabel_r7);
    ɵɵadvance(3);
    ɵɵproperty("ngIf", ctx_r1.getItemProp(processedItem_r3, "badge"));
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.isItemGroup(processedItem_r3));
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_span_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 19);
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(4);
    const processedItem_r3 = ctx_r4.$implicit;
    const index_r6 = ctx_r4.index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.cn(ctx_r1.cx("itemIcon"), ctx_r1.getItemProp(processedItem_r3, "icon"), ctx_r1.getItemProp(processedItem_r3, "iconClass")));
    ɵɵproperty("ngStyle", ctx_r1.getItemProp(processedItem_r3, "iconStyle"))("pBind", ctx_r1.getPTOptions(processedItem_r3, index_r6, "itemIcon"));
    ɵɵattribute("aria-hidden", true)("tabindex", -1);
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_span_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 19);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(4);
    const processedItem_r3 = ctx_r4.$implicit;
    const index_r6 = ctx_r4.index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.cn(ctx_r1.cx("itemLabel"), ctx_r1.getItemProp(processedItem_r3, "labelClass")));
    ɵɵproperty("ngStyle", ctx_r1.getItemProp(processedItem_r3, "labelStyle"))("pBind", ctx_r1.getPTOptions(processedItem_r3, index_r6, "itemLabel"));
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx_r1.getItemLabel(processedItem_r3), " ");
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 20);
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(4);
    const processedItem_r3 = ctx_r4.$implicit;
    const index_r6 = ctx_r4.index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.cn(ctx_r1.cx("itemLabel"), ctx_r1.getItemProp(processedItem_r3, "labelClass")));
    ɵɵproperty("ngStyle", ctx_r1.getItemProp(processedItem_r3, "labelStyle"))("innerHTML", ctx_r1.getItemLabel(processedItem_r3), ɵɵsanitizeHtml)("pBind", ctx_r1.getPTOptions(processedItem_r3, index_r6, "itemLabel"));
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_span_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span");
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const processedItem_r3 = ɵɵnextContext(4).$implicit;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.cn(ctx_r1.cx("itemBadge"), ctx_r1.getItemProp(processedItem_r3, "badgeStyleClass")));
    ɵɵadvance();
    ɵɵtextInterpolate(ctx_r1.getItemProp(processedItem_r3, "badge"));
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_ng_container_6__svg_svg_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵnamespaceSVG();
    ɵɵelement(0, "svg", 23);
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext(5);
    const processedItem_r3 = ctx_r4.$implicit;
    const index_r6 = ctx_r4.index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.cx("submenuIcon"));
    ɵɵproperty("pBind", ctx_r1.getPTOptions(processedItem_r3, index_r6, "submenuIcon"));
    ɵɵattribute("aria-hidden", true);
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_ng_container_6_2_ng_template_0_Template(rf, ctx) {
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_ng_container_6_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_ng_container_6_2_ng_template_0_Template, 0, 0, "ng-template", 24);
  }
  if (rf & 2) {
    ɵɵariaProperty("aria-hidden", true);
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_ng_container_6__svg_svg_1_Template, 1, 4, "svg", 21)(2, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_ng_container_6_2_Template, 1, 1, null, 22);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(6);
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r1.tieredMenu.submenuIconTemplate && !ctx_r1.tieredMenu._submenuIconTemplate);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r1.tieredMenu.submenuIconTemplate || ctx_r1.tieredMenu._submenuIconTemplate);
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "a", 25);
    ɵɵtemplate(1, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_span_1_Template, 1, 6, "span", 16)(2, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_span_2_Template, 2, 5, "span", 17)(3, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_ng_template_3_Template, 1, 5, "ng-template", null, 2, ɵɵtemplateRefExtractor)(5, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_span_5_Template, 2, 3, "span", 18)(6, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_ng_container_6_Template, 3, 2, "ng-container", 11);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const htmlLabel_r8 = ɵɵreference(4);
    const ctx_r4 = ɵɵnextContext(3);
    const processedItem_r3 = ctx_r4.$implicit;
    const index_r6 = ctx_r4.index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.cn(ctx_r1.cx("itemLink"), ctx_r1.getItemProp(processedItem_r3, "linkClass")));
    ɵɵproperty("routerLink", ctx_r1.getItemProp(processedItem_r3, "routerLink"))("queryParams", ctx_r1.getItemProp(processedItem_r3, "queryParams"))("routerLinkActive", "p-tieredmenu-item-link-active")("routerLinkActiveOptions", ctx_r1.getItemProp(processedItem_r3, "routerLinkActiveOptions") || ɵɵpureFunction0(23, _c2))("target", ctx_r1.getItemProp(processedItem_r3, "target"))("ngStyle", ctx_r1.getItemProp(processedItem_r3, "linkStyle"))("fragment", ctx_r1.getItemProp(processedItem_r3, "fragment"))("queryParamsHandling", ctx_r1.getItemProp(processedItem_r3, "queryParamsHandling"))("preserveFragment", ctx_r1.getItemProp(processedItem_r3, "preserveFragment"))("skipLocationChange", ctx_r1.getItemProp(processedItem_r3, "skipLocationChange"))("replaceUrl", ctx_r1.getItemProp(processedItem_r3, "replaceUrl"))("state", ctx_r1.getItemProp(processedItem_r3, "state"))("pBind", ctx_r1.getPTOptions(processedItem_r3, index_r6, "itemLink"));
    ɵɵattribute("data-automationid", ctx_r1.getItemProp(processedItem_r3, "automationId"))("title", ctx_r1.getItemProp(processedItem_r3, "title"))("tabindex", -1);
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.getItemProp(processedItem_r3, "icon"));
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.getItemProp(processedItem_r3, "escape"))("ngIfElse", htmlLabel_r8);
    ɵɵadvance(3);
    ɵɵproperty("ngIf", ctx_r1.getItemProp(processedItem_r3, "badge"));
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.isItemGroup(processedItem_r3));
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_1_Template, 7, 14, "a", 13)(2, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_a_2_Template, 7, 24, "a", 14);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const processedItem_r3 = ɵɵnextContext(2).$implicit;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r1.getItemProp(processedItem_r3, "routerLink"));
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.getItemProp(processedItem_r3, "routerLink"));
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_4_1_ng_template_0_Template(rf, ctx) {
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_4_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_4_1_ng_template_0_Template, 0, 0, "ng-template");
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_4_1_Template, 1, 0, null, 26);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const processedItem_r3 = ɵɵnextContext(2).$implicit;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r1.itemTemplate)("ngTemplateOutletContext", ɵɵpureFunction2(2, _c3, processedItem_r3.item, ctx_r1.getItemProp(processedItem_r3, "items")));
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_p_tieredmenusub_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "p-tieredmenusub", 27);
    ɵɵlistener("itemClick", function TieredMenuSub_Conditional_0_ng_template_2_li_1_p_tieredmenusub_5_Template_p_tieredmenusub_itemClick_0_listener($event) {
      ɵɵrestoreView(_r9);
      const ctx_r1 = ɵɵnextContext(4);
      return ɵɵresetView(ctx_r1.itemClick.emit($event));
    })("itemMouseEnter", function TieredMenuSub_Conditional_0_ng_template_2_li_1_p_tieredmenusub_5_Template_p_tieredmenusub_itemMouseEnter_0_listener($event) {
      ɵɵrestoreView(_r9);
      const ctx_r1 = ɵɵnextContext(4);
      return ɵɵresetView(ctx_r1.onItemMouseEnter($event));
    });
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const processedItem_r3 = ɵɵnextContext(2).$implicit;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵproperty("items", processedItem_r3.items)("itemTemplate", ctx_r1.itemTemplate)("autoDisplay", ctx_r1.autoDisplay)("menuId", ctx_r1.menuId)("visible", ctx_r1.isItemActive(processedItem_r3) && ctx_r1.isItemGroup(processedItem_r3))("activeItemPath", ctx_r1.activeItemPath())("focusedItemId", ctx_r1.focusedItemId)("ariaLabelledBy", ctx_r1.getItemId(processedItem_r3))("level", ctx_r1.level + 1)("pt", ctx_r1.pt())("motionOptions", ctx_r1.motionOptions)("unstyled", ctx_r1.unstyled());
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_li_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "li", 9, 1)(2, "div", 10);
    ɵɵlistener("click", function TieredMenuSub_Conditional_0_ng_template_2_li_1_Template_div_click_2_listener($event) {
      ɵɵrestoreView(_r4);
      const processedItem_r3 = ɵɵnextContext().$implicit;
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onItemClick($event, processedItem_r3));
    })("mouseenter", function TieredMenuSub_Conditional_0_ng_template_2_li_1_Template_div_mouseenter_2_listener($event) {
      ɵɵrestoreView(_r4);
      const processedItem_r3 = ɵɵnextContext().$implicit;
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onItemMouseEnter({
        $event,
        processedItem: processedItem_r3
      }));
    });
    ɵɵtemplate(3, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_3_Template, 3, 2, "ng-container", 11)(4, TieredMenuSub_Conditional_0_ng_template_2_li_1_ng_container_4_Template, 2, 5, "ng-container", 11);
    ɵɵelementEnd();
    ɵɵtemplate(5, TieredMenuSub_Conditional_0_ng_template_2_li_1_p_tieredmenusub_5_Template, 1, 12, "p-tieredmenusub", 12);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r4 = ɵɵnextContext();
    const processedItem_r3 = ctx_r4.$implicit;
    const index_r6 = ctx_r4.index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.cn(ctx_r1.cx("item", ɵɵpureFunction1(23, _c1, processedItem_r3)), ctx_r1.getItemProp(processedItem_r3, "styleClass")));
    ɵɵproperty("ngStyle", ctx_r1.getItemProp(processedItem_r3, "style"))("pBind", ctx_r1.getPTOptions(processedItem_r3, index_r6, "item"))("pTooltip", ctx_r1.getItemProp(processedItem_r3, "tooltip"))("tooltipOptions", ctx_r1.getItemProp(processedItem_r3, "tooltipOptions"))("pTooltipUnstyled", ctx_r1.unstyled());
    ɵɵattribute("id", ctx_r1.getItemId(processedItem_r3))("data-p-highlight", ctx_r1.isItemActive(processedItem_r3))("data-p-focused", ctx_r1.isItemFocused(processedItem_r3))("data-p-disabled", ctx_r1.isItemDisabled(processedItem_r3))("aria-label", ctx_r1.getItemLabel(processedItem_r3))("aria-disabled", ctx_r1.isItemDisabled(processedItem_r3) || void 0)("aria-haspopup", ctx_r1.isItemGroup(processedItem_r3) && !ctx_r1.getItemProp(processedItem_r3, "to") ? "menu" : void 0)("aria-expanded", ctx_r1.isItemGroup(processedItem_r3) ? ctx_r1.isItemActive(processedItem_r3) : void 0)("aria-setsize", ctx_r1.getAriaSetSize())("aria-posinset", ctx_r1.getAriaPosInset(index_r6));
    ɵɵadvance(2);
    ɵɵclassMap(ctx_r1.cx("itemContent"));
    ɵɵproperty("pBind", ctx_r1.getPTOptions(processedItem_r3, index_r6, "itemContent"));
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r1.itemTemplate);
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.itemTemplate);
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.isItemVisible(processedItem_r3) && ctx_r1.isItemGroup(processedItem_r3));
  }
}
function TieredMenuSub_Conditional_0_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TieredMenuSub_Conditional_0_ng_template_2_li_0_Template, 1, 6, "li", 6)(1, TieredMenuSub_Conditional_0_ng_template_2_li_1_Template, 6, 25, "li", 7);
  }
  if (rf & 2) {
    const processedItem_r3 = ctx.$implicit;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵproperty("ngIf", ctx_r1.isItemVisible(processedItem_r3) && ctx_r1.getItemProp(processedItem_r3, "separator"));
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.isItemVisible(processedItem_r3) && !ctx_r1.getItemProp(processedItem_r3, "separator"));
  }
}
function TieredMenuSub_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "ul", 4, 0);
    ɵɵlistener("keydown", function TieredMenuSub_Conditional_0_Template_ul_keydown_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.menuKeydown.emit($event));
    })("focus", function TieredMenuSub_Conditional_0_Template_ul_focus_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.menuFocus.emit($event));
    })("blur", function TieredMenuSub_Conditional_0_Template_ul_blur_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.menuBlur.emit($event));
    })("pMotionOnBeforeEnter", function TieredMenuSub_Conditional_0_Template_ul_pMotionOnBeforeEnter_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onBeforeEnter($event));
    })("pMotionOnAfterLeave", function TieredMenuSub_Conditional_0_Template_ul_pMotionOnAfterLeave_0_listener() {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onAfterLeave());
    });
    ɵɵtemplate(2, TieredMenuSub_Conditional_0_ng_template_2_Template, 2, 2, "ng-template", 5);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵstyleMap(ctx_r1.inlineStyles);
    ɵɵclassMap(ctx_r1.root ? ctx_r1.cx("rootList") : ctx_r1.cx("submenu"));
    ɵɵproperty("id", ctx_r1.menuId + "_list")("tabindex", ctx_r1.tabindex)("pBind", ctx_r1._ptm(ctx_r1.root ? "rootList" : "submenu"))("pMotion", ctx_r1.root ? true : ctx_r1.visible)("pMotionDisabled", ctx_r1.root)("pMotionAppear", true)("pMotionName", "p-anchored-overlay")("pMotionOptions", ctx_r1.motionOptions);
    ɵɵattribute("aria-label", ctx_r1.ariaLabel)("aria-labelledBy", ctx_r1.ariaLabelledBy)("aria-activedescendant", ctx_r1.focusedItemId)("aria-orientation", "vertical");
    ɵɵadvance(2);
    ɵɵproperty("ngForOf", ctx_r1.items);
  }
}
var _c4 = ["submenuicon"];
var _c5 = ["item"];
var _c6 = ["rootmenu"];
var _c7 = ["container"];
function TieredMenu_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 3, 0);
    ɵɵlistener("click", function TieredMenu_Conditional_0_Template_div_click_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onOverlayClick($event));
    })("pMotionOnBeforeEnter", function TieredMenu_Conditional_0_Template_div_pMotionOnBeforeEnter_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onOverlayBeforeEnter($event));
    })("pMotionOnAfterEnter", function TieredMenu_Conditional_0_Template_div_pMotionOnAfterEnter_0_listener() {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onOverlayAfterEnter());
    })("pMotionOnAfterLeave", function TieredMenu_Conditional_0_Template_div_pMotionOnAfterLeave_0_listener() {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onOverlayAfterLeave());
    });
    ɵɵelementStart(2, "p-tieredMenuSub", 4, 1);
    ɵɵlistener("itemClick", function TieredMenu_Conditional_0_Template_p_tieredMenuSub_itemClick_2_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onItemClick($event));
    })("menuFocus", function TieredMenu_Conditional_0_Template_p_tieredMenuSub_menuFocus_2_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onMenuFocus($event));
    })("menuBlur", function TieredMenu_Conditional_0_Template_p_tieredMenuSub_menuBlur_2_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onMenuBlur($event));
    })("menuKeydown", function TieredMenu_Conditional_0_Template_p_tieredMenuSub_menuKeydown_2_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onKeyDown($event));
    })("itemMouseEnter", function TieredMenu_Conditional_0_Template_p_tieredMenuSub_itemMouseEnter_2_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onItemMouseEnter($event));
    });
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵclassMap(ctx_r1.cn(ctx_r1.cx("root"), ctx_r1.styleClass));
    ɵɵproperty("id", ctx_r1.id)("ngStyle", ctx_r1.style)("pBind", ctx_r1.ptm("root"))("pMotion", ctx_r1.visible || !ctx_r1.popup)("pMotionName", "p-anchored-overlay")("pMotionAppear", true)("pMotionDisabled", !ctx_r1.popup)("pMotionOptions", ctx_r1.computedMotionOptions());
    ɵɵadvance(2);
    ɵɵproperty("root", true)("visible", true)("items", ctx_r1.processedItems)("itemTemplate", ctx_r1.itemTemplate || ctx_r1._itemTemplate)("menuId", ctx_r1.id)("tabindex", !ctx_r1.disabled ? ctx_r1.tabindex : -1)("ariaLabel", ctx_r1.ariaLabel)("ariaLabelledBy", ctx_r1.ariaLabelledBy)("baseZIndex", ctx_r1.baseZIndex)("autoZIndex", ctx_r1.autoZIndex)("autoDisplay", ctx_r1.autoDisplay)("popup", ctx_r1.popup)("focusedItemId", ctx_r1.focused ? ctx_r1.focusedItemId : void 0)("activeItemPath", ctx_r1.activeItemPath())("pt", ctx_r1.pt())("unstyled", ctx_r1.unstyled())("motionOptions", ctx_r1.computedMotionOptions());
  }
}
var inlineStyles = {
  submenu: ({
    instance,
    processedItem
  }) => ({
    display: instance.isItemActive(processedItem) ? "flex" : "none"
  })
};
var classes = {
  root: ({
    instance
  }) => ["p-tieredmenu p-component", {
    "p-tieredmenu-overlay": instance.popup,
    "p-tieredmenu-mobile": instance.queryMatches()
  }],
  start: "p-tieredmenu-start",
  rootList: "p-tieredmenu-root-list",
  item: ({
    instance,
    processedItem
  }) => ["p-tieredmenu-item", {
    "p-tieredmenu-item-active": instance.isItemActive(processedItem),
    "p-focus": instance.isItemFocused(processedItem),
    "p-disabled": instance.isItemDisabled(processedItem)
  }],
  itemContent: "p-tieredmenu-item-content",
  itemLink: "p-tieredmenu-item-link",
  itemIcon: "p-tieredmenu-item-icon",
  itemLabel: "p-tieredmenu-item-label",
  itemBadge: "p-menuitem-badge",
  submenuIcon: "p-tieredmenu-submenu-icon",
  submenu: "p-tieredmenu-submenu",
  separator: "p-tieredmenu-separator",
  end: "p-tieredmenu-end"
};
var TieredMenuStyle = class _TieredMenuStyle extends BaseStyle {
  name = "tieredmenu";
  style = style;
  classes = classes;
  inlineStyles = inlineStyles;
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵTieredMenuStyle_BaseFactory;
    return function TieredMenuStyle_Factory(__ngFactoryType__) {
      return (ɵTieredMenuStyle_BaseFactory || (ɵTieredMenuStyle_BaseFactory = ɵɵgetInheritedFactory(_TieredMenuStyle)))(__ngFactoryType__ || _TieredMenuStyle);
    };
  })();
  static ɵprov = ɵɵdefineInjectable({
    token: _TieredMenuStyle,
    factory: _TieredMenuStyle.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TieredMenuStyle, [{
    type: Injectable
  }], null, null);
})();
var TieredMenuClasses;
(function(TieredMenuClasses2) {
  TieredMenuClasses2["root"] = "p-tieredmenu";
  TieredMenuClasses2["start"] = "p-tieredmenu-start";
  TieredMenuClasses2["rootList"] = "p-tieredmenu-root-list";
  TieredMenuClasses2["item"] = "p-tieredmenu-item";
  TieredMenuClasses2["itemContent"] = "p-tieredmenu-item-content";
  TieredMenuClasses2["itemLink"] = "p-tieredmenu-item-link";
  TieredMenuClasses2["itemIcon"] = "p-tieredmenu-item-icon";
  TieredMenuClasses2["itemLabel"] = "p-tieredmenu-item-label";
  TieredMenuClasses2["submenuIcon"] = "p-tieredmenu-submenu-icon";
  TieredMenuClasses2["submenu"] = "p-tieredmenu-submenu";
  TieredMenuClasses2["separator"] = "p-tieredmenu-separator";
  TieredMenuClasses2["end"] = "p-tieredmenu-end";
})(TieredMenuClasses || (TieredMenuClasses = {}));
var TIEREDMENU_INSTANCE = new InjectionToken("TIEREDMENU_INSTANCE");
var TIEREDMENUSUB_INSTANCE = new InjectionToken("TIEREDMENUSUB_INSTANCE");
var TieredMenuSub = class _TieredMenuSub extends BaseComponent {
  el;
  renderer;
  tieredMenu;
  get visible() {
    return this._visible;
  }
  set visible(value) {
    this._visible = value;
    if (this._visible || this.root) {
      this.render.set(true);
    }
  }
  items;
  itemTemplate;
  root = false;
  autoDisplay;
  autoZIndex = true;
  baseZIndex = 0;
  popup;
  menuId;
  ariaLabel;
  ariaLabelledBy;
  level = 0;
  focusedItemId;
  activeItemPath = input([], ...ngDevMode ? [{
    debugName: "activeItemPath"
  }] : (
    /* istanbul ignore next */
    []
  ));
  motionOptions;
  tabindex = 0;
  inlineStyles;
  itemClick = new EventEmitter();
  itemMouseEnter = new EventEmitter();
  menuFocus = new EventEmitter();
  menuBlur = new EventEmitter();
  menuKeydown = new EventEmitter();
  sublistViewChild;
  render = signal(false, ...ngDevMode ? [{
    debugName: "render"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _componentStyle = inject(TieredMenuStyle);
  bindDirectiveInstance = inject(Bind, {
    self: true
  });
  $pcTieredMenu = inject(TIEREDMENU_INSTANCE, {
    optional: true,
    skipSelf: true
  }) ?? void 0;
  $pcTieredMenuSub = inject(TIEREDMENUSUB_INSTANCE, {
    optional: true,
    skipSelf: true
  }) ?? void 0;
  _visible = false;
  onAfterViewChecked() {
    this.bindDirectiveInstance.setAttrs(this.ptms(["host", "root"]));
  }
  constructor(el, renderer, tieredMenu) {
    super();
    this.el = el;
    this.renderer = renderer;
    this.tieredMenu = tieredMenu;
  }
  positionSubmenu(sublist) {
    if (isPlatformBrowser(this.tieredMenu.platformId)) {
      if (sublist) {
        zt(sublist, this.level);
      }
    }
  }
  getItemProp(processedItem, name, params = null) {
    return processedItem && processedItem.item ? m(processedItem.item[name], params) : void 0;
  }
  getItemId(processedItem) {
    return processedItem.item?.id ?? `${this.menuId}_${processedItem.key}`;
  }
  getItemKey(processedItem) {
    return this.getItemId(processedItem);
  }
  getItemLabel(processedItem) {
    return this.getItemProp(processedItem, "label");
  }
  getAriaSetSize() {
    return this.items.filter((processedItem) => this.isItemVisible(processedItem) && !this.getItemProp(processedItem, "separator")).length;
  }
  getAriaPosInset(index) {
    return index - this.items.slice(0, index).filter((processedItem) => {
      const isItemVisible = this.isItemVisible(processedItem);
      const isVisibleSeparator = isItemVisible && this.getItemProp(processedItem, "separator");
      return !isItemVisible || isVisibleSeparator;
    }).length + 1;
  }
  isItemVisible(processedItem) {
    return this.getItemProp(processedItem, "visible") !== false;
  }
  isItemActive(processedItem) {
    if (this.activeItemPath()) {
      return this.activeItemPath().some((path) => path.key === processedItem.key);
    }
    return false;
  }
  isItemDisabled(processedItem) {
    return this.getItemProp(processedItem, "disabled");
  }
  isItemFocused(processedItem) {
    return this.focusedItemId === this.getItemId(processedItem);
  }
  isItemGroup(processedItem) {
    return s(processedItem.items);
  }
  // TODO: will be removed later. Helper method to get PT from parent ContextMenu if available, otherwise use own PT
  _ptm(section, options) {
    return this.$pcTieredMenu ? this.$pcTieredMenu.ptm(section, options) : this.ptm(section, options);
  }
  getPTOptions(processedItem, index, key) {
    return this._ptm(key, {
      context: {
        item: processedItem.item,
        index,
        active: this.isItemActive(processedItem),
        focused: this.isItemFocused(processedItem),
        disabled: this.isItemDisabled(processedItem)
      }
    });
  }
  onItemMouseEnter(param) {
    if (this.autoDisplay) {
      const {
        event,
        processedItem
      } = param;
      this.itemMouseEnter.emit({
        originalEvent: event,
        processedItem
      });
    }
  }
  onItemClick(event, processedItem) {
    this.getItemProp(processedItem, "command", {
      originalEvent: event,
      item: processedItem.item
    });
    this.itemClick.emit({
      originalEvent: event,
      processedItem,
      isFocus: true
    });
  }
  onBeforeEnter(event) {
    this.positionSubmenu(event.element);
  }
  onAfterLeave() {
    this.render.set(false);
  }
  static ɵfac = function TieredMenuSub_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _TieredMenuSub)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(forwardRef(() => TieredMenu)));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _TieredMenuSub,
    selectors: [["p-tieredMenuSub"], ["p-tieredmenusub"]],
    viewQuery: function TieredMenuSub_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.sublistViewChild = _t.first);
      }
    },
    inputs: {
      visible: "visible",
      items: "items",
      itemTemplate: "itemTemplate",
      root: [2, "root", "root", booleanAttribute],
      autoDisplay: [2, "autoDisplay", "autoDisplay", booleanAttribute],
      autoZIndex: [2, "autoZIndex", "autoZIndex", booleanAttribute],
      baseZIndex: [2, "baseZIndex", "baseZIndex", numberAttribute],
      popup: [2, "popup", "popup", booleanAttribute],
      menuId: "menuId",
      ariaLabel: "ariaLabel",
      ariaLabelledBy: "ariaLabelledBy",
      level: [2, "level", "level", numberAttribute],
      focusedItemId: "focusedItemId",
      activeItemPath: [1, "activeItemPath"],
      motionOptions: "motionOptions",
      tabindex: [2, "tabindex", "tabindex", numberAttribute],
      inlineStyles: "inlineStyles"
    },
    outputs: {
      itemClick: "itemClick",
      itemMouseEnter: "itemMouseEnter",
      menuFocus: "menuFocus",
      menuBlur: "menuBlur",
      menuKeydown: "menuKeydown"
    },
    features: [ɵɵProvidersFeature([{
      provide: TIEREDMENUSUB_INSTANCE,
      useExisting: forwardRef(() => _TieredMenuSub)
    }, {
      provide: PARENT_INSTANCE,
      useExisting: forwardRef(() => _TieredMenuSub)
    }]), ɵɵHostDirectivesFeature([Bind]), ɵɵInheritDefinitionFeature],
    decls: 1,
    vars: 1,
    consts: [["sublist", ""], ["listItem", ""], ["htmlLabel", ""], ["role", "menu", 3, "class", "id", "tabindex", "pBind", "style", "pMotion", "pMotionDisabled", "pMotionAppear", "pMotionName", "pMotionOptions"], ["role", "menu", 3, "keydown", "focus", "blur", "pMotionOnBeforeEnter", "pMotionOnAfterLeave", "id", "tabindex", "pBind", "pMotion", "pMotionDisabled", "pMotionAppear", "pMotionName", "pMotionOptions"], ["ngFor", "", 3, "ngForOf"], ["role", "separator", 3, "style", "class", "pBind", 4, "ngIf"], ["role", "menuitem", 3, "ngStyle", "class", "pBind", "pTooltip", "tooltipOptions", "pTooltipUnstyled", 4, "ngIf"], ["role", "separator", 3, "pBind"], ["role", "menuitem", 3, "ngStyle", "pBind", "pTooltip", "tooltipOptions", "pTooltipUnstyled"], [3, "click", "mouseenter", "pBind"], [4, "ngIf"], [3, "items", "itemTemplate", "autoDisplay", "menuId", "visible", "activeItemPath", "focusedItemId", "ariaLabelledBy", "level", "pt", "motionOptions", "unstyled", "itemClick", "itemMouseEnter", 4, "ngIf"], ["pRipple", "", 3, "target", "class", "ngStyle", "pBind", 4, "ngIf"], ["pRipple", "", 3, "routerLink", "queryParams", "routerLinkActive", "routerLinkActiveOptions", "target", "class", "ngStyle", "fragment", "queryParamsHandling", "preserveFragment", "skipLocationChange", "replaceUrl", "state", "pBind", 4, "ngIf"], ["pRipple", "", 3, "target", "ngStyle", "pBind"], [3, "class", "ngStyle", "pBind", 4, "ngIf"], [3, "class", "ngStyle", "pBind", 4, "ngIf", "ngIfElse"], [3, "class", 4, "ngIf"], [3, "ngStyle", "pBind"], [3, "ngStyle", "innerHTML", "pBind"], ["data-p-icon", "angle-right", 3, "class", "pBind", 4, "ngIf"], [4, "ngTemplateOutlet"], ["data-p-icon", "angle-right", 3, "pBind"], [3, "aria-hidden"], ["pRipple", "", 3, "routerLink", "queryParams", "routerLinkActive", "routerLinkActiveOptions", "target", "ngStyle", "fragment", "queryParamsHandling", "preserveFragment", "skipLocationChange", "replaceUrl", "state", "pBind"], [4, "ngTemplateOutlet", "ngTemplateOutletContext"], [3, "itemClick", "itemMouseEnter", "items", "itemTemplate", "autoDisplay", "menuId", "visible", "activeItemPath", "focusedItemId", "ariaLabelledBy", "level", "pt", "motionOptions", "unstyled"]],
    template: function TieredMenuSub_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵconditionalCreate(0, TieredMenuSub_Conditional_0_Template, 3, 17, "ul", 3);
      }
      if (rf & 2) {
        ɵɵconditional(ctx.render() ? 0 : -1);
      }
    },
    dependencies: [_TieredMenuSub, CommonModule, NgForOf, NgIf, NgTemplateOutlet, NgStyle, RouterModule, RouterLink, RouterLinkActive, Ripple, TooltipModule, Tooltip, Bind, AngleRightIcon, SharedModule, BindModule, MotionModule, MotionDirective],
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TieredMenuSub, [{
    type: Component,
    args: [{
      selector: "p-tieredMenuSub, p-tieredmenusub",
      standalone: true,
      imports: [CommonModule, RouterModule, Ripple, TooltipModule, AngleRightIcon, SharedModule, BindModule, MotionModule],
      template: `
        @if (render()) {
            <ul
                #sublist
                role="menu"
                [class]="root ? cx('rootList') : cx('submenu')"
                [id]="menuId + '_list'"
                [tabindex]="tabindex"
                [attr.aria-label]="ariaLabel"
                [attr.aria-labelledBy]="ariaLabelledBy"
                [attr.aria-activedescendant]="focusedItemId"
                [attr.aria-orientation]="'vertical'"
                [pBind]="_ptm(root ? 'rootList' : 'submenu')"
                (keydown)="menuKeydown.emit($event)"
                (focus)="menuFocus.emit($event)"
                (blur)="menuBlur.emit($event)"
                [style]="inlineStyles"
                [pMotion]="root ? true : visible"
                [pMotionDisabled]="root"
                [pMotionAppear]="true"
                [pMotionName]="'p-anchored-overlay'"
                [pMotionOptions]="motionOptions"
                (pMotionOnBeforeEnter)="onBeforeEnter($event)"
                (pMotionOnAfterLeave)="onAfterLeave()"
            >
                <ng-template ngFor let-processedItem [ngForOf]="items" let-index="index">
                    <li
                        *ngIf="isItemVisible(processedItem) && getItemProp(processedItem, 'separator')"
                        [attr.id]="getItemId(processedItem)"
                        [style]="getItemProp(processedItem, 'style')"
                        [class]="cn(cx('separator'), getItemProp(processedItem, 'class'), getItemProp(processedItem, 'styleClass'))"
                        role="separator"
                        [pBind]="_ptm('separator')"
                    ></li>
                    <li
                        #listItem
                        *ngIf="isItemVisible(processedItem) && !getItemProp(processedItem, 'separator')"
                        role="menuitem"
                        [attr.id]="getItemId(processedItem)"
                        [attr.data-p-highlight]="isItemActive(processedItem)"
                        [attr.data-p-focused]="isItemFocused(processedItem)"
                        [attr.data-p-disabled]="isItemDisabled(processedItem)"
                        [attr.aria-label]="getItemLabel(processedItem)"
                        [attr.aria-disabled]="isItemDisabled(processedItem) || undefined"
                        [attr.aria-haspopup]="isItemGroup(processedItem) && !getItemProp(processedItem, 'to') ? 'menu' : undefined"
                        [attr.aria-expanded]="isItemGroup(processedItem) ? isItemActive(processedItem) : undefined"
                        [attr.aria-setsize]="getAriaSetSize()"
                        [attr.aria-posinset]="getAriaPosInset(index)"
                        [ngStyle]="getItemProp(processedItem, 'style')"
                        [class]="cn(cx('item', { processedItem }), getItemProp(processedItem, 'styleClass'))"
                        [pBind]="getPTOptions(processedItem, index, 'item')"
                        [pTooltip]="getItemProp(processedItem, 'tooltip')"
                        [tooltipOptions]="getItemProp(processedItem, 'tooltipOptions')"
                        [pTooltipUnstyled]="unstyled()"
                    >
                        <div [class]="cx('itemContent')" [pBind]="getPTOptions(processedItem, index, 'itemContent')" (click)="onItemClick($event, processedItem)" (mouseenter)="onItemMouseEnter({ $event, processedItem })">
                            <ng-container *ngIf="!itemTemplate">
                                <a
                                    *ngIf="!getItemProp(processedItem, 'routerLink')"
                                    [attr.href]="getItemProp(processedItem, 'url')"
                                    [attr.data-automationid]="getItemProp(processedItem, 'automationId')"
                                    [attr.title]="getItemProp(processedItem, 'title')"
                                    [target]="getItemProp(processedItem, 'target')"
                                    [class]="cn(cx('itemLink'), getItemProp(processedItem, 'linkClass'))"
                                    [ngStyle]="getItemProp(processedItem, 'linkStyle')"
                                    [attr.tabindex]="-1"
                                    [pBind]="getPTOptions(processedItem, index, 'itemLink')"
                                    pRipple
                                >
                                    <span
                                        *ngIf="getItemProp(processedItem, 'icon')"
                                        [class]="cn(cx('itemIcon'), getItemProp(processedItem, 'icon'), getItemProp(processedItem, 'iconClass'))"
                                        [ngStyle]="getItemProp(processedItem, 'iconStyle')"
                                        [pBind]="getPTOptions(processedItem, index, 'itemIcon')"
                                        [attr.tabindex]="-1"
                                    >
                                    </span>
                                    <span
                                        *ngIf="getItemProp(processedItem, 'escape'); else htmlLabel"
                                        [class]="cn(cx('itemLabel'), getItemProp(processedItem, 'labelClass'))"
                                        [ngStyle]="getItemProp(processedItem, 'labelStyle')"
                                        [pBind]="getPTOptions(processedItem, index, 'itemLabel')"
                                    >
                                        {{ getItemLabel(processedItem) }}
                                    </span>
                                    <ng-template #htmlLabel>
                                        <span
                                            [class]="cn(cx('itemLabel'), getItemProp(processedItem, 'labelClass'))"
                                            [ngStyle]="getItemProp(processedItem, 'labelStyle')"
                                            [innerHTML]="getItemLabel(processedItem)"
                                            [pBind]="getPTOptions(processedItem, index, 'itemLabel')"
                                        ></span>
                                    </ng-template>
                                    <span *ngIf="getItemProp(processedItem, 'badge')" [class]="cn(cx('itemBadge'), getItemProp(processedItem, 'badgeStyleClass'))">{{ getItemProp(processedItem, 'badge') }}</span>

                                    <ng-container *ngIf="isItemGroup(processedItem)">
                                        <svg
                                            data-p-icon="angle-right"
                                            *ngIf="!tieredMenu.submenuIconTemplate && !tieredMenu._submenuIconTemplate"
                                            [class]="cx('submenuIcon')"
                                            [pBind]="getPTOptions(processedItem, index, 'submenuIcon')"
                                            [attr.aria-hidden]="true"
                                        />
                                        <ng-template *ngTemplateOutlet="tieredMenu.submenuIconTemplate || tieredMenu._submenuIconTemplate" [attr.aria-hidden]="true"></ng-template>
                                    </ng-container>
                                </a>
                                <a
                                    *ngIf="getItemProp(processedItem, 'routerLink')"
                                    [routerLink]="getItemProp(processedItem, 'routerLink')"
                                    [attr.data-automationid]="getItemProp(processedItem, 'automationId')"
                                    [attr.title]="getItemProp(processedItem, 'title')"
                                    [attr.tabindex]="-1"
                                    [queryParams]="getItemProp(processedItem, 'queryParams')"
                                    [routerLinkActive]="'p-tieredmenu-item-link-active'"
                                    [routerLinkActiveOptions]="getItemProp(processedItem, 'routerLinkActiveOptions') || { exact: false }"
                                    [target]="getItemProp(processedItem, 'target')"
                                    [class]="cn(cx('itemLink'), getItemProp(processedItem, 'linkClass'))"
                                    [ngStyle]="getItemProp(processedItem, 'linkStyle')"
                                    [fragment]="getItemProp(processedItem, 'fragment')"
                                    [queryParamsHandling]="getItemProp(processedItem, 'queryParamsHandling')"
                                    [preserveFragment]="getItemProp(processedItem, 'preserveFragment')"
                                    [skipLocationChange]="getItemProp(processedItem, 'skipLocationChange')"
                                    [replaceUrl]="getItemProp(processedItem, 'replaceUrl')"
                                    [state]="getItemProp(processedItem, 'state')"
                                    [pBind]="getPTOptions(processedItem, index, 'itemLink')"
                                    pRipple
                                >
                                    <span
                                        *ngIf="getItemProp(processedItem, 'icon')"
                                        [class]="cn(cx('itemIcon'), getItemProp(processedItem, 'icon'), getItemProp(processedItem, 'iconClass'))"
                                        [ngStyle]="getItemProp(processedItem, 'iconStyle')"
                                        [pBind]="getPTOptions(processedItem, index, 'itemIcon')"
                                        [attr.aria-hidden]="true"
                                        [attr.tabindex]="-1"
                                    >
                                    </span>
                                    <span
                                        *ngIf="getItemProp(processedItem, 'escape'); else htmlLabel"
                                        [class]="cn(cx('itemLabel'), getItemProp(processedItem, 'labelClass'))"
                                        [ngStyle]="getItemProp(processedItem, 'labelStyle')"
                                        [pBind]="getPTOptions(processedItem, index, 'itemLabel')"
                                    >
                                        {{ getItemLabel(processedItem) }}
                                    </span>
                                    <ng-template #htmlLabel>
                                        <span
                                            [class]="cn(cx('itemLabel'), getItemProp(processedItem, 'labelClass'))"
                                            [ngStyle]="getItemProp(processedItem, 'labelStyle')"
                                            [innerHTML]="getItemLabel(processedItem)"
                                            [pBind]="getPTOptions(processedItem, index, 'itemLabel')"
                                        ></span>
                                    </ng-template>
                                    <span *ngIf="getItemProp(processedItem, 'badge')" [class]="cn(cx('itemBadge'), getItemProp(processedItem, 'badgeStyleClass'))">{{ getItemProp(processedItem, 'badge') }}</span>

                                    <ng-container *ngIf="isItemGroup(processedItem)">
                                        <svg
                                            data-p-icon="angle-right"
                                            *ngIf="!tieredMenu.submenuIconTemplate && !tieredMenu._submenuIconTemplate"
                                            [class]="cx('submenuIcon')"
                                            [pBind]="getPTOptions(processedItem, index, 'submenuIcon')"
                                            [attr.aria-hidden]="true"
                                        />
                                        <ng-template *ngTemplateOutlet="tieredMenu.submenuIconTemplate || tieredMenu._submenuIconTemplate" [attr.aria-hidden]="true"></ng-template>
                                    </ng-container>
                                </a>
                            </ng-container>
                            <ng-container *ngIf="itemTemplate">
                                <ng-template *ngTemplateOutlet="itemTemplate; context: { $implicit: processedItem.item, hasSubmenu: getItemProp(processedItem, 'items') }"></ng-template>
                            </ng-container>
                        </div>

                        <p-tieredmenusub
                            *ngIf="isItemVisible(processedItem) && isItemGroup(processedItem)"
                            [items]="processedItem.items"
                            [itemTemplate]="itemTemplate"
                            [autoDisplay]="autoDisplay"
                            [menuId]="menuId"
                            [visible]="isItemActive(processedItem) && isItemGroup(processedItem)"
                            [activeItemPath]="activeItemPath()"
                            [focusedItemId]="focusedItemId"
                            [ariaLabelledBy]="getItemId(processedItem)"
                            [level]="level + 1"
                            (itemClick)="itemClick.emit($event)"
                            (itemMouseEnter)="onItemMouseEnter($event)"
                            [pt]="pt()"
                            [motionOptions]="motionOptions"
                            [unstyled]="unstyled()"
                        ></p-tieredmenusub>
                    </li>
                </ng-template>
            </ul>
        }
    `,
      encapsulation: ViewEncapsulation.None,
      providers: [{
        provide: TIEREDMENUSUB_INSTANCE,
        useExisting: forwardRef(() => TieredMenuSub)
      }, {
        provide: PARENT_INSTANCE,
        useExisting: forwardRef(() => TieredMenuSub)
      }],
      hostDirectives: [Bind]
    }]
  }], () => [{
    type: ElementRef
  }, {
    type: Renderer2
  }, {
    type: TieredMenu,
    decorators: [{
      type: Inject,
      args: [forwardRef(() => TieredMenu)]
    }]
  }], {
    visible: [{
      type: Input
    }],
    items: [{
      type: Input
    }],
    itemTemplate: [{
      type: Input
    }],
    root: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    autoDisplay: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    autoZIndex: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    baseZIndex: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    popup: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    menuId: [{
      type: Input
    }],
    ariaLabel: [{
      type: Input
    }],
    ariaLabelledBy: [{
      type: Input
    }],
    level: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    focusedItemId: [{
      type: Input
    }],
    activeItemPath: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "activeItemPath",
        required: false
      }]
    }],
    motionOptions: [{
      type: Input
    }],
    tabindex: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    inlineStyles: [{
      type: Input
    }],
    itemClick: [{
      type: Output
    }],
    itemMouseEnter: [{
      type: Output
    }],
    menuFocus: [{
      type: Output
    }],
    menuBlur: [{
      type: Output
    }],
    menuKeydown: [{
      type: Output
    }],
    sublistViewChild: [{
      type: ViewChild,
      args: ["sublist"]
    }]
  });
})();
var TieredMenu = class _TieredMenu extends BaseComponent {
  overlayService;
  componentName = "TieredMenu";
  /**
   * An array of menuitems.
   * @group Props
   */
  set model(value) {
    this._model = value;
    this._processedItems = this.createProcessedItems(this._model || []);
  }
  get model() {
    return this._model;
  }
  /**
   * Defines if menu would displayed as a popup.
   * @group Props
   */
  popup;
  /**
   * Inline style of the component.
   * @group Props
   */
  style;
  /**
   * Style class of the component.
   * @group Props
   */
  styleClass;
  /**
   * The breakpoint to define the maximum width boundary.
   * @group Props
   */
  breakpoint = "960px";
  /**
   * Whether to automatically manage layering.
   * @group Props
   */
  autoZIndex = true;
  /**
   * Base zIndex value to use in layering.
   * @group Props
   */
  baseZIndex = 0;
  /**
   * Whether to show a root submenu on mouse over.
   * @defaultValue true
   * @group Props
   */
  autoDisplay = true;
  /**
   * Transition options of the show animation.
   * @group Props
   * @deprecated since v21.0.0, use `motionOptions` instead.
   */
  showTransitionOptions = ".12s cubic-bezier(0, 0, 0.2, 1)";
  /**
   * Transition options of the hide animation.
   * @group Props
   * @deprecated since v21.0.0, use `motionOptions` instead.
   */
  hideTransitionOptions = ".1s linear";
  /**
   * Current id state as a string.
   * @group Props
   */
  id;
  /**
   * Defines a string value that labels an interactive element.
   * @group Props
   */
  ariaLabel;
  /**
   * Identifier of the underlying input element.
   * @group Props
   */
  ariaLabelledBy;
  /**
   * When present, it specifies that the component should be disabled.
   * @group Props
   */
  disabled = false;
  /**
   * Index of the element in tabbing order.
   * @group Props
   */
  tabindex = 0;
  /**
   * Target element to attach the overlay, valid values are "body" or a local ng-template variable of another element (note: use binding with brackets for template variables, e.g. [appendTo]="mydiv" for a div element having #mydiv as variable name).
   * @defaultValue 'self'
   * @group Props
   */
  appendTo = input(void 0, ...ngDevMode ? [{
    debugName: "appendTo"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * The motion options.
   * @group Props
   */
  motionOptions = input(void 0, ...ngDevMode ? [{
    debugName: "motionOptions"
  }] : (
    /* istanbul ignore next */
    []
  ));
  computedMotionOptions = computed(() => {
    return __spreadValues(__spreadValues({}, this.ptm("motion")), this.motionOptions());
  }, ...ngDevMode ? [{
    debugName: "computedMotionOptions"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * Callback to invoke when overlay menu is shown.
   * @group Emits
   */
  onShow = new EventEmitter();
  /**
   * Callback to invoke when overlay menu is hidden.
   * @group Emits
   */
  onHide = new EventEmitter();
  rootmenu;
  containerViewChild;
  /**
   * Custom submenu icon template.
   * @group Templates
   */
  submenuIconTemplate;
  /**
   * Custom item template.
   * @param {TieredMenuItemTemplateContext} context - item context.
   * @see {@link TieredMenuItemTemplateContext}
   * @group Templates
   */
  itemTemplate;
  templates;
  $appendTo = computed(() => this.appendTo() || this.config.overlayAppendTo(), ...ngDevMode ? [{
    debugName: "$appendTo"
  }] : (
    /* istanbul ignore next */
    []
  ));
  render = signal(false, ...ngDevMode ? [{
    debugName: "render"
  }] : (
    /* istanbul ignore next */
    []
  ));
  container;
  outsideClickListener;
  resizeListener;
  scrollHandler;
  target;
  relatedTarget;
  visible;
  dirty = false;
  focused = false;
  activeItemPath = signal([], ...ngDevMode ? [{
    debugName: "activeItemPath"
  }] : (
    /* istanbul ignore next */
    []
  ));
  number = signal(0, ...ngDevMode ? [{
    debugName: "number"
  }] : (
    /* istanbul ignore next */
    []
  ));
  focusedItemInfo = signal({
    index: -1,
    level: 0,
    parentKey: "",
    item: null
  }, ...ngDevMode ? [{
    debugName: "focusedItemInfo"
  }] : (
    /* istanbul ignore next */
    []
  ));
  searchValue = "";
  searchTimeout;
  _processedItems;
  _model;
  _componentStyle = inject(TieredMenuStyle);
  bindDirectiveInstance = inject(Bind, {
    self: true
  });
  matchMediaListener;
  query;
  queryMatches = signal(false, ...ngDevMode ? [{
    debugName: "queryMatches"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _submenuIconTemplate;
  _itemTemplate;
  get visibleItems() {
    const processedItem = this.activeItemPath().find((p) => p.key === this.focusedItemInfo().parentKey);
    return processedItem ? processedItem.items : this.processedItems;
  }
  get processedItems() {
    if (!this._processedItems || !this._processedItems.length) {
      this._processedItems = this.createProcessedItems(this.model || []);
    }
    return this._processedItems;
  }
  get focusedItemId() {
    const focusedItemInfo = this.focusedItemInfo();
    return focusedItemInfo.item?.id ? focusedItemInfo.item.id : focusedItemInfo.index !== -1 ? `${this.id}${s(focusedItemInfo.parentKey) ? "_" + focusedItemInfo.parentKey : ""}_${focusedItemInfo.index}` : null;
  }
  constructor(overlayService) {
    super();
    this.overlayService = overlayService;
    effect(() => {
      const path = this.activeItemPath();
      if (s(path)) {
        this.bindOutsideClickListener();
        this.bindResizeListener();
      } else {
        this.unbindOutsideClickListener();
        this.unbindResizeListener();
      }
    });
  }
  onAfterViewChecked() {
    this.bindDirectiveInstance.setAttrs(this.ptms(["host", "root"]));
  }
  onInit() {
    this.bindMatchMediaListener();
    this.id = this.id || s2("pn_id_");
  }
  onAfterContentInit() {
    this.templates?.forEach((item) => {
      switch (item.getType()) {
        case "submenuicon":
          this._submenuIconTemplate = item.template;
          break;
        case "item":
          this._itemTemplate = item.template;
          break;
        default:
          this._itemTemplate = item.template;
          break;
      }
    });
  }
  bindMatchMediaListener() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.matchMediaListener) {
        const query = window.matchMedia(`(max-width: ${this.breakpoint})`);
        this.query = query;
        this.queryMatches.set(query.matches);
        this.matchMediaListener = () => {
          this.queryMatches.set(query.matches);
        };
        query.addEventListener("change", this.matchMediaListener);
      }
    }
  }
  unbindMatchMediaListener() {
    if (this.matchMediaListener) {
      this.query.removeEventListener("change", this.matchMediaListener);
      this.matchMediaListener = null;
    }
  }
  createProcessedItems(items, level = 0, parent = {}, parentKey = "") {
    const processedItems = [];
    items && items.forEach((item, index) => {
      const key = (parentKey !== "" ? parentKey + "_" : "") + index;
      const newItem = {
        item,
        index,
        level,
        key,
        parent,
        parentKey
      };
      newItem["items"] = this.createProcessedItems(item.items, level + 1, newItem, key);
      processedItems.push(newItem);
    });
    return processedItems;
  }
  getItemProp(item, name) {
    return item ? m(item[name]) : void 0;
  }
  getProccessedItemLabel(processedItem) {
    return processedItem ? this.getItemLabel(processedItem.item) : void 0;
  }
  getItemLabel(item) {
    return this.getItemProp(item, "label");
  }
  isProcessedItemGroup(processedItem) {
    return processedItem && s(processedItem.items);
  }
  isSelected(processedItem) {
    return this.activeItemPath().some((p) => p.key === processedItem.key);
  }
  isValidSelectedItem(processedItem) {
    return this.isValidItem(processedItem) && this.isSelected(processedItem);
  }
  isValidItem(processedItem) {
    return !!processedItem && !this.isItemDisabled(processedItem.item) && !this.isItemSeparator(processedItem.item) && this.isItemVisible(processedItem.item);
  }
  isItemDisabled(item) {
    return this.getItemProp(item, "disabled");
  }
  isItemVisible(item) {
    return this.getItemProp(item, "visible") !== false;
  }
  isItemSeparator(item) {
    return this.getItemProp(item, "separator");
  }
  isItemMatched(processedItem) {
    return this.isValidItem(processedItem) && this.getProccessedItemLabel(processedItem).toLocaleLowerCase().startsWith(this.searchValue.toLocaleLowerCase());
  }
  isProccessedItemGroup(processedItem) {
    return processedItem && s(processedItem.items);
  }
  onOverlayClick(event) {
    if (this.popup) {
      this.overlayService.add({
        originalEvent: event,
        target: this.el.nativeElement
      });
    }
  }
  onItemClick(event) {
    const {
      originalEvent,
      processedItem
    } = event;
    const grouped = this.isProcessedItemGroup(processedItem);
    const root = l(processedItem.parent);
    const selected = this.isSelected(processedItem);
    if (selected) {
      const {
        index,
        key,
        level,
        parentKey,
        item
      } = processedItem;
      this.activeItemPath.set(this.activeItemPath().filter((p) => key !== p.key && key.startsWith(p.key)));
      this.focusedItemInfo.set({
        index,
        level,
        parentKey,
        item
      });
      this.dirty = true;
      bt(this.rootmenu?.sublistViewChild?.nativeElement);
    } else {
      if (grouped) {
        this.onItemChange(event);
      } else {
        const rootProcessedItem = root ? processedItem : this.activeItemPath().find((p) => p.parentKey === "");
        this.hide(originalEvent);
        this.changeFocusedItemIndex(originalEvent, rootProcessedItem?.index ?? -1);
        bt(this.rootmenu?.sublistViewChild?.nativeElement);
      }
    }
  }
  onItemMouseEnter(event) {
    if (!Yt()) {
      if (this.dirty) {
        this.onItemChange(event, "hover");
      }
    } else {
      this.onItemChange({
        event,
        processedItem: event.processedItem,
        focus: this.autoDisplay
      }, "hover");
    }
  }
  onKeyDown(event) {
    const metaKey = event.metaKey || event.ctrlKey;
    switch (event.code) {
      case "ArrowDown":
        this.onArrowDownKey(event);
        break;
      case "ArrowUp":
        this.onArrowUpKey(event);
        break;
      case "ArrowLeft":
        this.onArrowLeftKey(event);
        break;
      case "ArrowRight":
        this.onArrowRightKey(event);
        break;
      case "Home":
        this.onHomeKey(event);
        break;
      case "End":
        this.onEndKey(event);
        break;
      case "Space":
        this.onSpaceKey(event);
        break;
      case "Enter":
        this.onEnterKey(event);
        break;
      case "Escape":
        this.onEscapeKey(event);
        break;
      case "Tab":
        this.onTabKey(event);
        break;
      case "PageDown":
      case "PageUp":
      case "Backspace":
      case "ShiftLeft":
      case "ShiftRight":
        break;
      default:
        if (!metaKey && J(event.key)) {
          this.searchItems(event, event.key);
        }
        break;
    }
  }
  onArrowDownKey(event) {
    const itemIndex = this.focusedItemInfo().index !== -1 ? this.findNextItemIndex(this.focusedItemInfo().index) : this.findFirstFocusedItemIndex();
    this.changeFocusedItemIndex(event, itemIndex);
    event.preventDefault();
  }
  onArrowRightKey(event) {
    const processedItem = this.visibleItems[this.focusedItemInfo().index];
    const grouped = this.isProccessedItemGroup(processedItem);
    const item = processedItem?.item;
    if (grouped) {
      this.onItemChange({
        originalEvent: event,
        processedItem
      });
      this.focusedItemInfo.set({
        index: -1,
        parentKey: processedItem.key,
        item
      });
      this.searchValue = "";
      this.onArrowDownKey(event);
    }
    event.preventDefault();
  }
  onArrowUpKey(event) {
    if (event.altKey) {
      if (this.focusedItemInfo().index !== -1) {
        const processedItem = this.visibleItems[this.focusedItemInfo().index];
        const grouped = this.isProccessedItemGroup(processedItem);
        !grouped && this.onItemChange({
          originalEvent: event,
          processedItem
        });
      }
      this.popup && this.hide(event, true);
      event.preventDefault();
    } else {
      const itemIndex = this.focusedItemInfo().index !== -1 ? this.findPrevItemIndex(this.focusedItemInfo().index) : this.findLastFocusedItemIndex();
      this.changeFocusedItemIndex(event, itemIndex);
      event.preventDefault();
    }
  }
  onArrowLeftKey(event) {
    const processedItem = this.visibleItems[this.focusedItemInfo().index];
    if (!processedItem) {
      event.preventDefault();
      return;
    }
    const parentItem = this.activeItemPath().find((p) => p.key === processedItem.parentKey);
    const root = l(processedItem.parent);
    if (!root) {
      this.focusedItemInfo.set({
        index: -1,
        parentKey: parentItem ? parentItem.parentKey : "",
        item: processedItem.item
      });
      this.searchValue = "";
      this.onArrowDownKey(event);
    }
    const activeItemPath = this.activeItemPath().filter((p) => p.parentKey !== this.focusedItemInfo().parentKey);
    this.activeItemPath.set(activeItemPath);
    event.preventDefault();
  }
  onHomeKey(event) {
    this.changeFocusedItemIndex(event, this.findFirstItemIndex());
    event.preventDefault();
  }
  onEndKey(event) {
    this.changeFocusedItemIndex(event, this.findLastItemIndex());
    event.preventDefault();
  }
  onSpaceKey(event) {
    this.onEnterKey(event);
  }
  onEscapeKey(event) {
    this.hide(event, true);
    this.focusedItemInfo().index = this.findFirstFocusedItemIndex();
    event.preventDefault();
  }
  onTabKey(event) {
    if (this.focusedItemInfo().index !== -1) {
      const processedItem = this.visibleItems[this.focusedItemInfo().index];
      const grouped = this.isProccessedItemGroup(processedItem);
      !grouped && this.onItemChange({
        originalEvent: event,
        processedItem
      });
    }
    this.hide();
  }
  onEnterKey(event) {
    if (this.focusedItemInfo().index !== -1) {
      const element = z(this.rootmenu?.el?.nativeElement, `li[id="${`${this.focusedItemId}`}"]`);
      const anchorElement = element && (z(element, '[data-pc-section="itemlink"]') || z(element, "a,button"));
      anchorElement ? anchorElement.click() : element && element.click();
      if (!this.popup) {
        const processedItem = this.visibleItems[this.focusedItemInfo().index];
        const grouped = this.isProccessedItemGroup(processedItem);
        !grouped && (this.focusedItemInfo().index = this.findFirstFocusedItemIndex());
      }
    }
    event.preventDefault();
  }
  onItemChange(event, type) {
    const {
      processedItem,
      isFocus
    } = event;
    if (l(processedItem)) return;
    const {
      index,
      key,
      level,
      parentKey,
      items,
      item
    } = processedItem;
    const grouped = s(items);
    const activeItemPath = this.activeItemPath().filter((p) => p.parentKey !== parentKey && p.parentKey !== key);
    grouped && activeItemPath.push(processedItem);
    this.focusedItemInfo.set({
      index,
      level,
      parentKey,
      item
    });
    grouped && (this.dirty = true);
    isFocus && bt(this.rootmenu?.sublistViewChild?.nativeElement);
    if (type === "hover" && this.queryMatches()) {
      return;
    }
    this.activeItemPath.set(activeItemPath);
  }
  onMenuFocus(event) {
    this.focused = true;
    if (this.focusedItemInfo().index === -1 && !this.popup) {
    }
  }
  onMenuBlur(event) {
    this.focused = false;
    this.focusedItemInfo.set({
      index: -1,
      level: 0,
      parentKey: "",
      item: null
    });
    this.searchValue = "";
    this.dirty = false;
  }
  onOverlayBeforeEnter(event) {
    if (this.popup) {
      this.container = event.element;
      S(this.container, {
        position: "absolute"
      });
      this.moveOnTop();
      this.onShow.emit({});
      this.$attrSelector && this.container?.setAttribute(this.$attrSelector, "");
      this.appendOverlay();
      this.alignOverlay();
    }
  }
  onOverlayAfterEnter() {
    if (this.popup) {
      this.bindOutsideClickListener();
      this.bindResizeListener();
      this.bindScrollListener();
      this.scrollInView();
    }
    bt(this.rootmenu?.sublistViewChild?.nativeElement);
  }
  onOverlayAfterLeave() {
    this.restoreOverlayAppend();
    this.onOverlayHide();
    this.render.set(false);
    this.onHide.emit({});
  }
  relativeAlign = false;
  alignOverlay() {
    if (this.container && this.target) {
      if (this.relativeAlign) I(this.container, this.target);
      else D(this.container, this.target);
      const targetWidth = v(this.target);
      if (targetWidth > v(this.container)) {
        this.container.style.minWidth = v(this.target) + "px";
      }
    }
  }
  appendOverlay() {
    if (this.$appendTo() && this.$appendTo() !== "self") {
      if (this.$appendTo() === "body") {
        ut(this.document.body, this.container);
      } else {
        ut(this.$appendTo(), this.container);
      }
    }
  }
  restoreOverlayAppend() {
    if (this.container && this.$appendTo() !== "self") {
      ut(this.el.nativeElement, this.container);
    }
  }
  moveOnTop() {
    if (this.autoZIndex) {
      zindexutils.set("menu", this.container, this.baseZIndex + this.config.zIndex.menu);
    }
  }
  /**
   * Hides the popup menu.
   * @group Method
   */
  hide(event, isFocus) {
    if (this.popup) {
      this.onHide.emit({});
      this.visible = false;
    }
    this.activeItemPath.set([]);
    this.focusedItemInfo.set({
      index: -1,
      level: 0,
      parentKey: ""
    });
    isFocus && bt(this.relatedTarget || this.target || this.rootmenu?.sublistViewChild?.nativeElement);
    this.dirty = false;
  }
  /**
   * Toggles the visibility of the popup menu.
   * @param {Event} event - Browser event.
   * @group Method
   */
  toggle(event) {
    this.visible ? this.hide(event, true) : this.show(event);
  }
  /**
   * Displays the popup menu.
   * @param {Event} even - Browser event.
   * @group Method
   */
  show(event, isFocus) {
    if (this.popup) {
      this.visible = true;
      this.target = this.target || event.currentTarget;
      this.relatedTarget = event.relatedTarget || null;
      this.relativeAlign = event?.relativeAlign || null;
    }
    this.render.set(true);
    this.focusedItemInfo.set({
      index: -1,
      level: 0,
      parentKey: ""
    });
    isFocus && bt(this.rootmenu?.sublistViewChild?.nativeElement);
    this.cd.markForCheck();
  }
  searchItems(event, char) {
    this.searchValue = (this.searchValue || "") + char;
    let itemIndex = -1;
    let matched = false;
    if (this.focusedItemInfo().index !== -1) {
      itemIndex = this.visibleItems.slice(this.focusedItemInfo().index).findIndex((processedItem) => this.isItemMatched(processedItem));
      itemIndex = itemIndex === -1 ? this.visibleItems.slice(0, this.focusedItemInfo().index).findIndex((processedItem) => this.isItemMatched(processedItem)) : itemIndex + this.focusedItemInfo().index;
    } else {
      itemIndex = this.visibleItems.findIndex((processedItem) => this.isItemMatched(processedItem));
    }
    if (itemIndex !== -1) {
      matched = true;
    }
    if (itemIndex === -1 && this.focusedItemInfo().index === -1) {
      itemIndex = this.findFirstFocusedItemIndex();
    }
    if (itemIndex !== -1) {
      this.changeFocusedItemIndex(event, itemIndex);
    }
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.searchValue = "";
      this.searchTimeout = null;
    }, 500);
    return matched;
  }
  findLastFocusedItemIndex() {
    const selectedIndex = this.findSelectedItemIndex();
    return selectedIndex < 0 ? this.findLastItemIndex() : selectedIndex;
  }
  findLastItemIndex() {
    return M(this.visibleItems, (processedItem) => this.isValidItem(processedItem));
  }
  findPrevItemIndex(index) {
    const matchedItemIndex = index > 0 ? M(this.visibleItems.slice(0, index), (processedItem) => this.isValidItem(processedItem)) : -1;
    return matchedItemIndex > -1 ? matchedItemIndex : index;
  }
  findNextItemIndex(index) {
    const matchedItemIndex = index < this.visibleItems.length - 1 ? this.visibleItems.slice(index + 1).findIndex((processedItem) => this.isValidItem(processedItem)) : -1;
    return matchedItemIndex > -1 ? matchedItemIndex + index + 1 : index;
  }
  findFirstFocusedItemIndex() {
    const selectedIndex = this.findSelectedItemIndex();
    return selectedIndex < 0 ? this.findFirstItemIndex() : selectedIndex;
  }
  findFirstItemIndex() {
    return this.visibleItems.findIndex((processedItem) => this.isValidItem(processedItem));
  }
  findSelectedItemIndex() {
    return this.visibleItems.findIndex((processedItem) => this.isValidSelectedItem(processedItem));
  }
  changeFocusedItemIndex(event, index) {
    if (this.focusedItemInfo().index !== index) {
      const focusedItemInfo = this.focusedItemInfo();
      this.focusedItemInfo.set(__spreadProps(__spreadValues({}, focusedItemInfo), {
        item: this.visibleItems[index].item,
        index
      }));
      this.scrollInView();
    }
  }
  scrollInView(index = -1) {
    const id = index !== -1 ? `${this.id}_${index}` : this.focusedItemId;
    const element = z(this.rootmenu?.el?.nativeElement, `li[id="${id}"]`);
    if (element) {
      element.scrollIntoView && element.scrollIntoView({
        block: "nearest",
        inline: "nearest"
      });
    }
  }
  bindScrollListener() {
    if (!this.scrollHandler) {
      this.scrollHandler = new ConnectedOverlayScrollHandler(this.target, (event) => {
        if (this.visible) {
          this.hide(event, true);
        }
      });
    }
    this.scrollHandler.bindScrollListener();
  }
  unbindScrollListener() {
    if (this.scrollHandler) {
      this.scrollHandler.unbindScrollListener();
      this.scrollHandler = null;
    }
  }
  bindResizeListener() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.resizeListener) {
        this.resizeListener = this.renderer.listen(this.document.defaultView, "resize", (event) => {
          if (!Yt()) {
            this.hide(event, true);
          }
        });
      }
    }
  }
  bindOutsideClickListener() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.outsideClickListener) {
        this.outsideClickListener = this.renderer.listen(this.document, "click", (event) => {
          const isOutsideContainer = this.containerViewChild && !this.containerViewChild.nativeElement.contains(event.target);
          const isOutsideTarget = this.popup ? !(this.target && (this.target === event.target || this.target.contains(event.target))) : true;
          if (isOutsideContainer && isOutsideTarget) {
            this.hide();
          }
        });
      }
    }
  }
  unbindOutsideClickListener() {
    if (this.outsideClickListener) {
      document.removeEventListener("click", this.outsideClickListener);
      this.outsideClickListener = null;
    }
  }
  unbindResizeListener() {
    if (this.resizeListener) {
      this.resizeListener();
      this.resizeListener = null;
    }
  }
  onOverlayHide() {
    this.unbindOutsideClickListener();
    this.unbindResizeListener();
    this.unbindScrollListener();
    if (!this.cd.destroyed) {
      this.target = null;
    }
    if (this.container && this.autoZIndex) {
      zindexutils.clear(this.container);
    }
  }
  onDestroy() {
    if (this.popup) {
      if (this.scrollHandler) {
        this.scrollHandler.destroy();
        this.scrollHandler = null;
      }
      this.restoreOverlayAppend();
      this.onOverlayHide();
    }
    this.unbindMatchMediaListener();
  }
  static ɵfac = function TieredMenu_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _TieredMenu)(ɵɵdirectiveInject(OverlayService));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _TieredMenu,
    selectors: [["p-tieredMenu"], ["p-tieredmenu"], ["p-tiered-menu"]],
    contentQueries: function TieredMenu_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, _c4, 4)(dirIndex, _c5, 4)(dirIndex, PrimeTemplate, 4);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.submenuIconTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.itemTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.templates = _t);
      }
    },
    viewQuery: function TieredMenu_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c6, 5)(_c7, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.rootmenu = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.containerViewChild = _t.first);
      }
    },
    inputs: {
      model: "model",
      popup: [2, "popup", "popup", booleanAttribute],
      style: "style",
      styleClass: "styleClass",
      breakpoint: "breakpoint",
      autoZIndex: [2, "autoZIndex", "autoZIndex", booleanAttribute],
      baseZIndex: [2, "baseZIndex", "baseZIndex", numberAttribute],
      autoDisplay: [2, "autoDisplay", "autoDisplay", booleanAttribute],
      showTransitionOptions: "showTransitionOptions",
      hideTransitionOptions: "hideTransitionOptions",
      id: "id",
      ariaLabel: "ariaLabel",
      ariaLabelledBy: "ariaLabelledBy",
      disabled: [2, "disabled", "disabled", booleanAttribute],
      tabindex: [2, "tabindex", "tabindex", numberAttribute],
      appendTo: [1, "appendTo"],
      motionOptions: [1, "motionOptions"]
    },
    outputs: {
      onShow: "onShow",
      onHide: "onHide"
    },
    features: [ɵɵProvidersFeature([TieredMenuStyle, {
      provide: TIEREDMENU_INSTANCE,
      useExisting: _TieredMenu
    }, {
      provide: PARENT_INSTANCE,
      useExisting: _TieredMenu
    }]), ɵɵHostDirectivesFeature([Bind]), ɵɵInheritDefinitionFeature],
    decls: 1,
    vars: 1,
    consts: [["container", ""], ["rootmenu", ""], [3, "id", "class", "ngStyle", "pBind", "pMotion", "pMotionName", "pMotionAppear", "pMotionDisabled", "pMotionOptions"], [3, "click", "pMotionOnBeforeEnter", "pMotionOnAfterEnter", "pMotionOnAfterLeave", "id", "ngStyle", "pBind", "pMotion", "pMotionName", "pMotionAppear", "pMotionDisabled", "pMotionOptions"], [3, "itemClick", "menuFocus", "menuBlur", "menuKeydown", "itemMouseEnter", "root", "visible", "items", "itemTemplate", "menuId", "tabindex", "ariaLabel", "ariaLabelledBy", "baseZIndex", "autoZIndex", "autoDisplay", "popup", "focusedItemId", "activeItemPath", "pt", "unstyled", "motionOptions"]],
    template: function TieredMenu_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵconditionalCreate(0, TieredMenu_Conditional_0_Template, 4, 27, "div", 2);
      }
      if (rf & 2) {
        ɵɵconditional(ctx.render() || !ctx.popup ? 0 : -1);
      }
    },
    dependencies: [CommonModule, NgStyle, TieredMenuSub, RouterModule, TooltipModule, Bind, SharedModule, BindModule, MotionModule, MotionDirective],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TieredMenu, [{
    type: Component,
    args: [{
      selector: "p-tieredMenu, p-tieredmenu, p-tiered-menu",
      standalone: true,
      imports: [CommonModule, TieredMenuSub, RouterModule, TooltipModule, SharedModule, BindModule, MotionModule],
      template: `
        @if (render() || !popup) {
            <div
                #container
                [id]="id"
                [class]="cn(cx('root'), styleClass)"
                [ngStyle]="style"
                [pBind]="ptm('root')"
                (click)="onOverlayClick($event)"
                [pMotion]="visible || !popup"
                [pMotionName]="'p-anchored-overlay'"
                [pMotionAppear]="true"
                [pMotionDisabled]="!popup"
                [pMotionOptions]="computedMotionOptions()"
                (pMotionOnBeforeEnter)="onOverlayBeforeEnter($event)"
                (pMotionOnAfterEnter)="onOverlayAfterEnter()"
                (pMotionOnAfterLeave)="onOverlayAfterLeave()"
            >
                <p-tieredMenuSub
                    #rootmenu
                    [root]="true"
                    [visible]="true"
                    [items]="processedItems"
                    [itemTemplate]="itemTemplate || _itemTemplate"
                    [menuId]="id"
                    [tabindex]="!disabled ? tabindex : -1"
                    [ariaLabel]="ariaLabel"
                    [ariaLabelledBy]="ariaLabelledBy"
                    [baseZIndex]="baseZIndex"
                    [autoZIndex]="autoZIndex"
                    [autoDisplay]="autoDisplay"
                    [popup]="popup"
                    [focusedItemId]="focused ? focusedItemId : undefined"
                    [activeItemPath]="activeItemPath()"
                    (itemClick)="onItemClick($event)"
                    (menuFocus)="onMenuFocus($event)"
                    (menuBlur)="onMenuBlur($event)"
                    (menuKeydown)="onKeyDown($event)"
                    (itemMouseEnter)="onItemMouseEnter($event)"
                    [pt]="pt()"
                    [unstyled]="unstyled()"
                    [motionOptions]="computedMotionOptions()"
                ></p-tieredMenuSub>
            </div>
        }
    `,
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      providers: [TieredMenuStyle, {
        provide: TIEREDMENU_INSTANCE,
        useExisting: TieredMenu
      }, {
        provide: PARENT_INSTANCE,
        useExisting: TieredMenu
      }],
      hostDirectives: [Bind]
    }]
  }], () => [{
    type: OverlayService
  }], {
    model: [{
      type: Input
    }],
    popup: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    style: [{
      type: Input
    }],
    styleClass: [{
      type: Input
    }],
    breakpoint: [{
      type: Input
    }],
    autoZIndex: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    baseZIndex: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    autoDisplay: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    showTransitionOptions: [{
      type: Input
    }],
    hideTransitionOptions: [{
      type: Input
    }],
    id: [{
      type: Input
    }],
    ariaLabel: [{
      type: Input
    }],
    ariaLabelledBy: [{
      type: Input
    }],
    disabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    tabindex: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    appendTo: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "appendTo",
        required: false
      }]
    }],
    motionOptions: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "motionOptions",
        required: false
      }]
    }],
    onShow: [{
      type: Output
    }],
    onHide: [{
      type: Output
    }],
    rootmenu: [{
      type: ViewChild,
      args: ["rootmenu"]
    }],
    containerViewChild: [{
      type: ViewChild,
      args: ["container"]
    }],
    submenuIconTemplate: [{
      type: ContentChild,
      args: ["submenuicon", {
        descendants: false
      }]
    }],
    itemTemplate: [{
      type: ContentChild,
      args: ["item", {
        descendants: false
      }]
    }],
    templates: [{
      type: ContentChildren,
      args: [PrimeTemplate]
    }]
  });
})();
var TieredMenuModule = class _TieredMenuModule {
  static ɵfac = function TieredMenuModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _TieredMenuModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _TieredMenuModule,
    imports: [TieredMenu, SharedModule],
    exports: [TieredMenu, SharedModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [TieredMenu, SharedModule, SharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TieredMenuModule, [{
    type: NgModule,
    args: [{
      imports: [TieredMenu, SharedModule],
      exports: [TieredMenu, SharedModule]
    }]
  }], null, null);
})();

// node_modules/.pnpm/@primeuix+styles@2.0.3/node_modules/@primeuix/styles/dist/splitbutton/index.mjs
var style2 = "\n    .p-splitbutton {\n        display: inline-flex;\n        position: relative;\n        border-radius: dt('splitbutton.border.radius');\n    }\n\n    .p-splitbutton-button.p-button {\n        border-start-end-radius: 0;\n        border-end-end-radius: 0;\n        border-inline-end: 0 none;\n    }\n\n    .p-splitbutton-button.p-button:focus-visible,\n    .p-splitbutton-dropdown.p-button:focus-visible {\n        z-index: 1;\n    }\n\n    .p-splitbutton-button.p-button:not(:disabled):hover,\n    .p-splitbutton-button.p-button:not(:disabled):active {\n        border-inline-end: 0 none;\n    }\n\n    .p-splitbutton-dropdown.p-button {\n        border-start-start-radius: 0;\n        border-end-start-radius: 0;\n    }\n\n    .p-splitbutton .p-menu {\n        min-width: 100%;\n    }\n\n    .p-splitbutton-fluid {\n        display: flex;\n    }\n\n    .p-splitbutton-rounded .p-splitbutton-dropdown.p-button {\n        border-start-end-radius: dt('splitbutton.rounded.border.radius');\n        border-end-end-radius: dt('splitbutton.rounded.border.radius');\n    }\n\n    .p-splitbutton-rounded .p-splitbutton-button.p-button {\n        border-start-start-radius: dt('splitbutton.rounded.border.radius');\n        border-end-start-radius: dt('splitbutton.rounded.border.radius');\n    }\n\n    .p-splitbutton-raised {\n        box-shadow: dt('splitbutton.raised.shadow');\n    }\n";

// node_modules/.pnpm/primeng@21.1.6_3dc8455f034b4170dd0602a69855ad24/node_modules/primeng/fesm2022/primeng-splitbutton.mjs
var _c02 = ["content"];
var _c12 = ["dropdownicon"];
var _c22 = ["defaultbtn"];
var _c32 = ["menu"];
function SplitButton_ng_container_0_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function SplitButton_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementContainerStart(0);
    ɵɵelementStart(1, "button", 8);
    ɵɵlistener("click", function SplitButton_ng_container_0_Template_button_click_1_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onDefaultButtonClick($event));
    });
    ɵɵtemplate(2, SplitButton_ng_container_0_ng_container_2_Template, 1, 0, "ng-container", 9);
    ɵɵelementEnd();
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵclassMap(ctx_r1.cx("pcButton"));
    ɵɵproperty("severity", ctx_r1.severity)("text", ctx_r1.text)("outlined", ctx_r1.outlined)("size", ctx_r1.size)("icon", ctx_r1.icon)("iconPos", ctx_r1.iconPos)("disabled", ctx_r1.disabled)("pAutoFocus", ctx_r1.autofocus)("pTooltip", ctx_r1.tooltip)("pTooltipUnstyled", ctx_r1.unstyled())("tooltipOptions", ctx_r1.tooltipOptions)("pt", ctx_r1.ptm("pcButton"))("unstyled", ctx_r1.unstyled());
    ɵɵattribute("tabindex", ctx_r1.tabindex)("aria-label", (ctx_r1.buttonProps == null ? null : ctx_r1.buttonProps["ariaLabel"]) || ctx_r1.label);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r1.contentTemplate || ctx_r1._contentTemplate);
  }
}
function SplitButton_ng_template_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 10, 2);
    ɵɵlistener("click", function SplitButton_ng_template_1_Template_button_click_0_listener($event) {
      ɵɵrestoreView(_r3);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onDefaultButtonClick($event));
    });
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵclassMap(ctx_r1.cx("pcButton"));
    ɵɵproperty("severity", ctx_r1.severity)("text", ctx_r1.text)("outlined", ctx_r1.outlined)("size", ctx_r1.size)("icon", ctx_r1.icon)("iconPos", ctx_r1.iconPos)("label", ctx_r1.label)("disabled", ctx_r1.buttonDisabled)("pAutoFocus", ctx_r1.autofocus)("pTooltip", ctx_r1.tooltip)("pTooltipUnstyled", ctx_r1.unstyled())("tooltipOptions", ctx_r1.tooltipOptions)("pt", ctx_r1.ptm("pcButton"))("unstyled", ctx_r1.unstyled());
    ɵɵattribute("tabindex", ctx_r1.tabindex)("aria-label", ctx_r1.buttonProps == null ? null : ctx_r1.buttonProps["ariaLabel"]);
  }
}
function SplitButton_span_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span");
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵclassMap(ctx_r1.dropdownIcon);
  }
}
function SplitButton_ng_container_5__svg_svg_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵnamespaceSVG();
    ɵɵelement(0, "svg", 12);
  }
}
function SplitButton_ng_container_5_2_ng_template_0_Template(rf, ctx) {
}
function SplitButton_ng_container_5_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, SplitButton_ng_container_5_2_ng_template_0_Template, 0, 0, "ng-template");
  }
}
function SplitButton_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, SplitButton_ng_container_5__svg_svg_1_Template, 1, 0, "svg", 11)(2, SplitButton_ng_container_5_2_Template, 1, 0, null, 9);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r1.dropdownIconTemplate && !ctx_r1._dropdownIconTemplate);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r1.dropdownIconTemplate || ctx_r1._dropdownIconTemplate);
  }
}
var classes2 = {
  root: ({
    instance
  }) => ["p-splitbutton p-component", {
    "p-splitbutton-raised": instance.raised,
    "p-splitbutton-rounded": instance.rounded,
    "p-splitbutton-outlined": instance.outlined,
    "p-splitbutton-text": instance.text,
    [`p-splitbutton-${instance.size === "small" ? "sm" : "lg"}`]: instance.size
  }],
  pcButton: "p-splitbutton-button",
  pcDropdown: "p-splitbutton-dropdown p-button-icon-only"
};
var SplitButtonStyle = class _SplitButtonStyle extends BaseStyle {
  name = "splitbutton";
  style = style2;
  classes = classes2;
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵSplitButtonStyle_BaseFactory;
    return function SplitButtonStyle_Factory(__ngFactoryType__) {
      return (ɵSplitButtonStyle_BaseFactory || (ɵSplitButtonStyle_BaseFactory = ɵɵgetInheritedFactory(_SplitButtonStyle)))(__ngFactoryType__ || _SplitButtonStyle);
    };
  })();
  static ɵprov = ɵɵdefineInjectable({
    token: _SplitButtonStyle,
    factory: _SplitButtonStyle.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SplitButtonStyle, [{
    type: Injectable
  }], null, null);
})();
var SplitButtonClasses;
(function(SplitButtonClasses2) {
  SplitButtonClasses2["root"] = "p-splitbutton";
  SplitButtonClasses2["pcButton"] = "p-splitbutton-button";
  SplitButtonClasses2["pcDropdown"] = "p-splitbutton-dropdown";
})(SplitButtonClasses || (SplitButtonClasses = {}));
var SPLITBUTTON_INSTANCE = new InjectionToken("SPLITBUTTON_INSTANCE");
var SplitButton = class _SplitButton extends BaseComponent {
  componentName = "SplitButton";
  $pcSplitButton = inject(SPLITBUTTON_INSTANCE, {
    optional: true,
    skipSelf: true
  }) ?? void 0;
  bindDirectiveInstance = inject(Bind, {
    self: true
  });
  onAfterViewChecked() {
    this.bindDirectiveInstance.setAttrs(this.ptms(["host", "root"]));
  }
  /**
   * MenuModel instance to define the overlay items.
   * @group Props
   */
  model;
  /**
   * Defines the style of the button.
   * @group Props
   */
  severity;
  /**
   * Add a shadow to indicate elevation.
   * @group Props
   */
  raised = false;
  /**
   * Add a circular border radius to the button.
   * @group Props
   */
  rounded = false;
  /**
   * Add a textual class to the button without a background initially.
   * @group Props
   */
  text = false;
  /**
   * Add a border class without a background initially.
   * @group Props
   */
  outlined = false;
  /**
   * Defines the size of the button.
   * @group Props
   */
  size = null;
  /**
   * Add a plain textual class to the button without a background initially.
   * @group Props
   */
  plain = false;
  /**
   * Name of the icon.
   * @group Props
   */
  icon;
  /**
   * Position of the icon.
   * @group Props
   */
  iconPos = "left";
  /**
   * Text of the button.
   * @group Props
   */
  label;
  /**
   * Tooltip for the main button.
   * @group Props
   */
  tooltip;
  /**
   * Tooltip options for the main button.
   * @group Props
   */
  tooltipOptions;
  /**
   * Class of the element.
   * @deprecated since v20.0.0, use `class` instead.
   * @group Props
   */
  styleClass;
  /**
   * Inline style of the overlay menu.
   * @group Props
   */
  menuStyle;
  /**
   * Style class of the overlay menu.
   * @group Props
   */
  menuStyleClass;
  /**
   * Name of the dropdown icon.
   * @group Props
   */
  dropdownIcon;
  /**
   * Target element to attach the overlay, valid values are "body" or a local ng-template variable of another element (note: use binding with brackets for template variables, e.g. [appendTo]="mydiv" for a div element having #mydiv as variable name).
   * @defaultValue 'body'
   * @group Props
   */
  appendTo = input("body", ...ngDevMode ? [{
    debugName: "appendTo"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * Indicates the direction of the element.
   * @group Props
   */
  dir;
  /**
   * Defines a string that labels the expand button for accessibility.
   * @group Props
   */
  expandAriaLabel;
  /**
   * Transition options of the show animation.
   * @group Props
   * @deprecated since v21.0.0. Use `motionOptions` instead.
   */
  showTransitionOptions = ".12s cubic-bezier(0, 0, 0.2, 1)";
  /**
   * Transition options of the hide animation.
   * @group Props
   * @deprecated since v21.0.0. Use `motionOptions` instead.
   */
  hideTransitionOptions = ".1s linear";
  /**
   * The motion options.
   * @group Props
   */
  motionOptions = input(void 0, ...ngDevMode ? [{
    debugName: "motionOptions"
  }] : (
    /* istanbul ignore next */
    []
  ));
  computedMotionOptions = computed(() => {
    return __spreadValues(__spreadValues({}, this.ptm("motion")), this.motionOptions());
  }, ...ngDevMode ? [{
    debugName: "computedMotionOptions"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * Button Props
   */
  buttonProps;
  /**
   * Menu Button Props
   */
  menuButtonProps;
  /**
   * When present, it specifies that the component should automatically get focus on load.
   * @group Props
   */
  autofocus;
  /**
   * When present, it specifies that the element should be disabled.
   * @group Props
   */
  set disabled(v2) {
    this._disabled = v2 ?? false;
    this.buttonDisabled = v2 ?? false;
    this.menuButtonDisabled = v2 ?? false;
  }
  get disabled() {
    return this._disabled;
  }
  /**
   * Index of the element in tabbing order.
   * @group Props
   */
  tabindex;
  /**
   * When present, it specifies that the menu button element should be disabled.
   * @group Props
   */
  menuButtonDisabled = false;
  /**
   * When present, it specifies that the button element should be disabled.
   * @group Props
   */
  buttonDisabled = false;
  /**
   * Callback to invoke when default command button is clicked.
   * @param {MouseEvent} event - Mouse event.
   * @group Emits
   */
  onClick = new EventEmitter();
  /**
   * Callback to invoke when overlay menu is hidden.
   * @group Emits
   */
  onMenuHide = new EventEmitter();
  /**
   * Callback to invoke when overlay menu is shown.
   * @group Emits
   */
  onMenuShow = new EventEmitter();
  /**
   * Callback to invoke when dropdown button is clicked.
   * @param {MouseEvent} event - Mouse event.
   * @group Emits
   */
  onDropdownClick = new EventEmitter();
  buttonViewChild;
  menu;
  /**
   * Custom content template.
   * @group Templates
   */
  contentTemplate;
  /**
   * Custom dropdown icon template.
   * @group Templates
   **/
  dropdownIconTemplate;
  templates;
  ariaId;
  isExpanded = signal(false, ...ngDevMode ? [{
    debugName: "isExpanded"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _disabled;
  _componentStyle = inject(SplitButtonStyle);
  _contentTemplate;
  _dropdownIconTemplate;
  $appendTo = computed(() => this.appendTo() || this.config.overlayAppendTo(), ...ngDevMode ? [{
    debugName: "$appendTo"
  }] : (
    /* istanbul ignore next */
    []
  ));
  onInit() {
    this.ariaId = s2("pn_id_");
  }
  onAfterContentInit() {
    this.templates?.forEach((item) => {
      switch (item.getType()) {
        case "content":
          this._contentTemplate = item.template;
          break;
        case "dropdownicon":
          this._dropdownIconTemplate = item.template;
          break;
        default:
          this._contentTemplate = item.template;
          break;
      }
    });
  }
  onDefaultButtonClick(event) {
    this.onClick?.emit(event);
    this.menu?.hide();
  }
  onDropdownButtonClick(event) {
    this.onDropdownClick.emit(event);
    this.menu?.toggle({
      currentTarget: this.el?.nativeElement,
      relativeAlign: this.$appendTo() == "self"
    });
  }
  onDropdownButtonKeydown(event) {
    if (event.code === "ArrowDown" || event.code === "ArrowUp") {
      this.onDropdownButtonClick();
      event.preventDefault();
    }
  }
  onHide() {
    this.isExpanded.set(false);
    this.onMenuHide.emit();
  }
  onShow() {
    this.isExpanded.set(true);
    this.onMenuShow.emit();
  }
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵSplitButton_BaseFactory;
    return function SplitButton_Factory(__ngFactoryType__) {
      return (ɵSplitButton_BaseFactory || (ɵSplitButton_BaseFactory = ɵɵgetInheritedFactory(_SplitButton)))(__ngFactoryType__ || _SplitButton);
    };
  })();
  static ɵcmp = ɵɵdefineComponent({
    type: _SplitButton,
    selectors: [["p-splitbutton"], ["p-splitButton"], ["p-split-button"]],
    contentQueries: function SplitButton_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, _c02, 4)(dirIndex, _c12, 4)(dirIndex, PrimeTemplate, 4);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.contentTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.dropdownIconTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.templates = _t);
      }
    },
    viewQuery: function SplitButton_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c22, 5)(_c32, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.buttonViewChild = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.menu = _t.first);
      }
    },
    hostVars: 3,
    hostBindings: function SplitButton_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵattribute("data-p-severity", ctx.severity);
        ɵɵclassMap(ctx.cn(ctx.cx("root"), ctx.styleClass));
      }
    },
    inputs: {
      model: "model",
      severity: "severity",
      raised: [2, "raised", "raised", booleanAttribute],
      rounded: [2, "rounded", "rounded", booleanAttribute],
      text: [2, "text", "text", booleanAttribute],
      outlined: [2, "outlined", "outlined", booleanAttribute],
      size: "size",
      plain: [2, "plain", "plain", booleanAttribute],
      icon: "icon",
      iconPos: "iconPos",
      label: "label",
      tooltip: "tooltip",
      tooltipOptions: "tooltipOptions",
      styleClass: "styleClass",
      menuStyle: "menuStyle",
      menuStyleClass: "menuStyleClass",
      dropdownIcon: "dropdownIcon",
      appendTo: [1, "appendTo"],
      dir: "dir",
      expandAriaLabel: "expandAriaLabel",
      showTransitionOptions: "showTransitionOptions",
      hideTransitionOptions: "hideTransitionOptions",
      motionOptions: [1, "motionOptions"],
      buttonProps: "buttonProps",
      menuButtonProps: "menuButtonProps",
      autofocus: [2, "autofocus", "autofocus", booleanAttribute],
      disabled: [2, "disabled", "disabled", booleanAttribute],
      tabindex: [2, "tabindex", "tabindex", numberAttribute],
      menuButtonDisabled: [2, "menuButtonDisabled", "menuButtonDisabled", booleanAttribute],
      buttonDisabled: [2, "buttonDisabled", "buttonDisabled", booleanAttribute]
    },
    outputs: {
      onClick: "onClick",
      onMenuHide: "onMenuHide",
      onMenuShow: "onMenuShow",
      onDropdownClick: "onDropdownClick"
    },
    features: [ɵɵProvidersFeature([SplitButtonStyle, {
      provide: SPLITBUTTON_INSTANCE,
      useExisting: _SplitButton
    }, {
      provide: PARENT_INSTANCE,
      useExisting: _SplitButton
    }]), ɵɵHostDirectivesFeature([Bind]), ɵɵInheritDefinitionFeature],
    decls: 8,
    vars: 27,
    consts: [["defaultButton", ""], ["menu", ""], ["defaultbtn", ""], [4, "ngIf", "ngIfElse"], ["type", "button", "pButton", "", "pRipple", "", 3, "click", "keydown", "size", "severity", "text", "outlined", "disabled", "pt", "unstyled"], [3, "class", 4, "ngIf"], [4, "ngIf"], [3, "onHide", "onShow", "id", "popup", "model", "styleClass", "appendTo", "motionOptions", "pt", "unstyled"], ["type", "button", "pButton", "", "pRipple", "", 3, "click", "severity", "text", "outlined", "size", "icon", "iconPos", "disabled", "pAutoFocus", "pTooltip", "pTooltipUnstyled", "tooltipOptions", "pt", "unstyled"], [4, "ngTemplateOutlet"], ["type", "button", "pButton", "", "pRipple", "", 3, "click", "severity", "text", "outlined", "size", "icon", "iconPos", "label", "disabled", "pAutoFocus", "pTooltip", "pTooltipUnstyled", "tooltipOptions", "pt", "unstyled"], ["data-p-icon", "chevron-down", 4, "ngIf"], ["data-p-icon", "chevron-down"]],
    template: function SplitButton_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵtemplate(0, SplitButton_ng_container_0_Template, 3, 18, "ng-container", 3)(1, SplitButton_ng_template_1_Template, 2, 18, "ng-template", null, 0, ɵɵtemplateRefExtractor);
        ɵɵelementStart(3, "button", 4);
        ɵɵlistener("click", function SplitButton_Template_button_click_3_listener($event) {
          return ctx.onDropdownButtonClick($event);
        })("keydown", function SplitButton_Template_button_keydown_3_listener($event) {
          return ctx.onDropdownButtonKeydown($event);
        });
        ɵɵtemplate(4, SplitButton_span_4_Template, 1, 2, "span", 5)(5, SplitButton_ng_container_5_Template, 3, 2, "ng-container", 6);
        ɵɵelementEnd();
        ɵɵelementStart(6, "p-tieredmenu", 7, 1);
        ɵɵlistener("onHide", function SplitButton_Template_p_tieredmenu_onHide_6_listener() {
          return ctx.onHide();
        })("onShow", function SplitButton_Template_p_tieredmenu_onShow_6_listener() {
          return ctx.onShow();
        });
        ɵɵelementEnd();
      }
      if (rf & 2) {
        const defaultButton_r4 = ɵɵreference(2);
        ɵɵproperty("ngIf", ctx.contentTemplate || ctx._contentTemplate)("ngIfElse", defaultButton_r4);
        ɵɵadvance(3);
        ɵɵclassMap(ctx.cx("pcDropdown"));
        ɵɵproperty("size", ctx.size)("severity", ctx.severity)("text", ctx.text)("outlined", ctx.outlined)("disabled", ctx.menuButtonDisabled)("pt", ctx.ptm("pcDropdown"))("unstyled", ctx.unstyled());
        ɵɵattribute("aria-label", (ctx.menuButtonProps == null ? null : ctx.menuButtonProps["ariaLabel"]) || ctx.expandAriaLabel)("aria-haspopup", (ctx.menuButtonProps == null ? null : ctx.menuButtonProps["ariaHasPopup"]) || true)("aria-expanded", (ctx.menuButtonProps == null ? null : ctx.menuButtonProps["ariaExpanded"]) || ctx.isExpanded())("aria-controls", (ctx.menuButtonProps == null ? null : ctx.menuButtonProps["ariaControls"]) || ctx.ariaId);
        ɵɵadvance();
        ɵɵproperty("ngIf", ctx.dropdownIcon);
        ɵɵadvance();
        ɵɵproperty("ngIf", !ctx.dropdownIcon);
        ɵɵadvance();
        ɵɵstyleMap(ctx.menuStyle);
        ɵɵproperty("id", ctx.ariaId)("popup", true)("model", ctx.model)("styleClass", ctx.menuStyleClass)("appendTo", ctx.$appendTo())("motionOptions", ctx.computedMotionOptions())("pt", ctx.ptm("pcMenu"))("unstyled", ctx.unstyled());
      }
    },
    dependencies: [CommonModule, NgIf, NgTemplateOutlet, ButtonDirective, TieredMenu, AutoFocus, ChevronDownIcon, Ripple, TooltipModule, Tooltip, SharedModule],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SplitButton, [{
    type: Component,
    args: [{
      selector: "p-splitbutton, p-splitButton, p-split-button",
      standalone: true,
      imports: [CommonModule, ButtonDirective, TieredMenu, AutoFocus, ChevronDownIcon, Ripple, TooltipModule, SharedModule],
      template: `
        <ng-container *ngIf="contentTemplate || _contentTemplate; else defaultButton">
            <button
                [class]="cx('pcButton')"
                type="button"
                pButton
                pRipple
                [severity]="severity"
                [text]="text"
                [outlined]="outlined"
                [size]="size"
                [icon]="icon"
                [iconPos]="iconPos"
                (click)="onDefaultButtonClick($event)"
                [disabled]="disabled"
                [attr.tabindex]="tabindex"
                [attr.aria-label]="buttonProps?.['ariaLabel'] || label"
                [pAutoFocus]="autofocus"
                [pTooltip]="tooltip"
                [pTooltipUnstyled]="unstyled()"
                [tooltipOptions]="tooltipOptions"
                [pt]="ptm('pcButton')"
                [unstyled]="unstyled()"
            >
                <ng-container *ngTemplateOutlet="contentTemplate || _contentTemplate"></ng-container>
            </button>
        </ng-container>
        <ng-template #defaultButton>
            <button
                #defaultbtn
                [class]="cx('pcButton')"
                type="button"
                pButton
                pRipple
                [severity]="severity"
                [text]="text"
                [outlined]="outlined"
                [size]="size"
                [icon]="icon"
                [iconPos]="iconPos"
                [label]="label"
                (click)="onDefaultButtonClick($event)"
                [disabled]="buttonDisabled"
                [attr.tabindex]="tabindex"
                [attr.aria-label]="buttonProps?.['ariaLabel']"
                [pAutoFocus]="autofocus"
                [pTooltip]="tooltip"
                [pTooltipUnstyled]="unstyled()"
                [tooltipOptions]="tooltipOptions"
                [pt]="ptm('pcButton')"
                [unstyled]="unstyled()"
            ></button>
        </ng-template>
        <button
            type="button"
            pButton
            pRipple
            [size]="size"
            [severity]="severity"
            [text]="text"
            [outlined]="outlined"
            [class]="cx('pcDropdown')"
            (click)="onDropdownButtonClick($event)"
            (keydown)="onDropdownButtonKeydown($event)"
            [disabled]="menuButtonDisabled"
            [attr.aria-label]="menuButtonProps?.['ariaLabel'] || expandAriaLabel"
            [attr.aria-haspopup]="menuButtonProps?.['ariaHasPopup'] || true"
            [attr.aria-expanded]="menuButtonProps?.['ariaExpanded'] || isExpanded()"
            [attr.aria-controls]="menuButtonProps?.['ariaControls'] || ariaId"
            [pt]="ptm('pcDropdown')"
            [unstyled]="unstyled()"
        >
            <span *ngIf="dropdownIcon" [class]="dropdownIcon"></span>
            <ng-container *ngIf="!dropdownIcon">
                <svg data-p-icon="chevron-down" *ngIf="!dropdownIconTemplate && !_dropdownIconTemplate" />
                <ng-template *ngTemplateOutlet="dropdownIconTemplate || _dropdownIconTemplate"></ng-template>
            </ng-container>
        </button>
        <p-tieredmenu
            [id]="ariaId"
            #menu
            [popup]="true"
            [model]="model"
            [style]="menuStyle"
            [styleClass]="menuStyleClass"
            [appendTo]="$appendTo()"
            [motionOptions]="computedMotionOptions()"
            (onHide)="onHide()"
            (onShow)="onShow()"
            [pt]="ptm('pcMenu')"
            [unstyled]="unstyled()"
        ></p-tieredmenu>
    `,
      changeDetection: ChangeDetectionStrategy.OnPush,
      providers: [SplitButtonStyle, {
        provide: SPLITBUTTON_INSTANCE,
        useExisting: SplitButton
      }, {
        provide: PARENT_INSTANCE,
        useExisting: SplitButton
      }],
      encapsulation: ViewEncapsulation.None,
      host: {
        "[class]": "cn(cx('root'), styleClass)",
        "[attr.data-p-severity]": "severity"
      },
      hostDirectives: [Bind]
    }]
  }], null, {
    model: [{
      type: Input
    }],
    severity: [{
      type: Input
    }],
    raised: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    rounded: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    text: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    outlined: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    size: [{
      type: Input
    }],
    plain: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    icon: [{
      type: Input
    }],
    iconPos: [{
      type: Input
    }],
    label: [{
      type: Input
    }],
    tooltip: [{
      type: Input
    }],
    tooltipOptions: [{
      type: Input
    }],
    styleClass: [{
      type: Input
    }],
    menuStyle: [{
      type: Input
    }],
    menuStyleClass: [{
      type: Input
    }],
    dropdownIcon: [{
      type: Input
    }],
    appendTo: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "appendTo",
        required: false
      }]
    }],
    dir: [{
      type: Input
    }],
    expandAriaLabel: [{
      type: Input
    }],
    showTransitionOptions: [{
      type: Input
    }],
    hideTransitionOptions: [{
      type: Input
    }],
    motionOptions: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "motionOptions",
        required: false
      }]
    }],
    buttonProps: [{
      type: Input
    }],
    menuButtonProps: [{
      type: Input
    }],
    autofocus: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    disabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    tabindex: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    menuButtonDisabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    buttonDisabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    onClick: [{
      type: Output
    }],
    onMenuHide: [{
      type: Output
    }],
    onMenuShow: [{
      type: Output
    }],
    onDropdownClick: [{
      type: Output
    }],
    buttonViewChild: [{
      type: ViewChild,
      args: ["defaultbtn"]
    }],
    menu: [{
      type: ViewChild,
      args: ["menu"]
    }],
    contentTemplate: [{
      type: ContentChild,
      args: ["content", {
        descendants: false
      }]
    }],
    dropdownIconTemplate: [{
      type: ContentChild,
      args: ["dropdownicon", {
        descendants: false
      }]
    }],
    templates: [{
      type: ContentChildren,
      args: [PrimeTemplate]
    }]
  });
})();
var SplitButtonModule = class _SplitButtonModule {
  static ɵfac = function SplitButtonModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _SplitButtonModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _SplitButtonModule,
    imports: [SplitButton, SharedModule],
    exports: [SplitButton, SharedModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [SplitButton, SharedModule, SharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SplitButtonModule, [{
    type: NgModule,
    args: [{
      imports: [SplitButton, SharedModule],
      exports: [SplitButton, SharedModule]
    }]
  }], null, null);
})();
export {
  SplitButton,
  SplitButtonClasses,
  SplitButtonModule,
  SplitButtonStyle
};
//# sourceMappingURL=primeng_splitbutton.js.map
