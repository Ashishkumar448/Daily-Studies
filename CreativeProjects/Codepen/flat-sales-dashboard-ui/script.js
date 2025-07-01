import React, { StrictMode } from "https://esm.sh/react";
import { createRoot } from "https://esm.sh/react-dom/client";
class Formatter {
    /**
     * Format a number to include digit separators when needed.
     * @param value Raw number value
     */
    static count(value) {
        return new Intl.NumberFormat(this.LOCALE).format(value);
    }
    /**
     * Format a number as a currency value.
     * @param value Raw number value
     */
    static currency(value) {
        return new Intl.NumberFormat(this.LOCALE, {
            currency: this.CURRENCY,
            style: "currency",
            notation: "compact",
            maximumFractionDigits: 1
        }).format(value);
    }
    /**
     * Format a number as a percent.
     * @param value Raw number value
     */
    static percent(value) {
        return new Intl.NumberFormat(this.LOCALE, {
            maximumFractionDigits: 1,
            style: "percent"
        }).format(value);
    }
    /**
     * Display a date in a friendly format.
     * @param value Raw date value
     */
    static date(date) {
        return new Intl.DateTimeFormat(this.LOCALE, {
            dateStyle: "short"
        }).format(date);
    }
}
Formatter.LOCALE = "en-US";
Formatter.CURRENCY = "USD";
class Random {
    /** Get a random value. */
    static random() {
        return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
    }
    /**
     * Get a random floating point value.
     * @param min Minimum value
     * @param max Maximum value
     */
    static float(min, max) {
        return (this.random() * (max - min)) + min;
    }
    /** Generate a hex-based hash. */
    static hash() {
        return Math.round(this.float(0, 1) * 0xffff).toString(16);
    }
    /**
     * Get a random integer value.
     * @param min Minimum value
     * @param max Maximum value
     */
    static int(min, max) {
        return Math.floor(this.random() * (max - min)) + min;
    }
}
function fakeData() {
    const data = {
        overview: {
            top: Random.int(1, 15) / 100,
            sales_goals: 0.672,
            number_of_sales: 2608,
            change: 0.035,
            total_sales: 42200,
            total_change: -0.045
        },
        users: [
            {
                name: "Jack O. Lantern",
                avatar: "https://assets.codepen.io/416221/photo-avatar1.jpg"
            },
            {
                name: "Jane Doe",
                avatar: "https://assets.codepen.io/416221/photo-avatar2.jpg"
            },
            {
                name: "Joe Schmoe",
                avatar: "https://assets.codepen.io/416221/photo-avatar3.jpg"
            }
        ],
        performance: {
            history: []
        },
        convert_rate: 0.375,
        customer_calls: [
            {
                name: "Ann Thrax",
                vip: true,
                source: "TikTok Leads"
            }
        ],
        sales_target: {
            target: 42200,
            streams: [
                {
                    change: -0.2,
                    revenue: 6800,
                    source: "Instagram"
                },
                {
                    change: -0.45,
                    revenue: 8200,
                    source: "Facebook"
                },
                {
                    change: 0.7,
                    revenue: 15400,
                    source: "TikTok"
                },
                {
                    change: -0.5,
                    revenue: 11800,
                    source: "Other"
                }
            ]
        }
    };
    // performance index
    const historyPercents = [0.8, 0.2, 0.5, 0.2, 0.9, 0.3, 0.55, 0.3, 0.15, 0.8, 0.35, 0.3, 0.4, 0.2, 0.85, 0.25, 0.852];
    historyPercents.forEach((percent, i) => {
        // decrement days from today
        const date = new Date();
        date.setDate(date.getDate() - (historyPercents.length - (i + 1)));
        data.performance.history.push({ date, percent });
    });
    return data;
}
createRoot(document.getElementById("root")).render(React.createElement(StrictMode, null,
    React.createElement(IconSprites, null),
    React.createElement(Dashboard, { data: fakeData() })));
function ActionBar({ users }) {
    const newestUsers = users.slice(0, 3);
    return (React.createElement("div", { className: "flex flex-col sm:flex-row justify-between gap-x-1 gap-y-3 mb-6" },
        React.createElement("div", { className: "flex gap-1 items-center" },
            newestUsers.map((user, i) => (React.createElement(Avatar, Object.assign({ key: i }, user, { indentStart: i > 0 })))),
            React.createElement(Button, { color: "black", icon: "plus" }, "Invite")),
        React.createElement("div", { className: "flex gap-1 items-center" },
            React.createElement(Button, { icon: "calendar", shape: "square", title: "Calendar" }),
            React.createElement("div", { className: "sm:hidden" },
                React.createElement(Button, { icon: "arrow-down", shape: "square", title: "Download Report" })),
            React.createElement("div", { className: "hidden sm:block" },
                React.createElement(Button, { icon: "arrow-down" }, "Download Report")),
            React.createElement("div", { className: "sm:hidden" },
                React.createElement(Button, { color: "red", icon: "microphone", shape: "square", title: "AI Assistant" })),
            React.createElement("div", { className: "hidden sm:block" },
                React.createElement(Button, { color: "red", icon: "microphone" }, "AI Assistant")))));
}
function Avatar({ name, avatar, indentStart }) {
    return (React.createElement("div", { className: `bg-gray-400 dark:bg-gray-700 border border-white dark:border-gray-800 rounded-full overflow-hidden w-12 h-12${indentStart ? ' -ms-8' : ''} transition-colors duration-300` },
        React.createElement("img", { className: "block w-full h-auto", src: avatar, width: "40", height: "40", alt: name, title: name })));
}
function Button({ children, title, color, icon, shape = "regular", outline, clickEvent }) {
    const buttonFills = {
        default: "bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 ",
        outline: "hover:bg-gray-100 dark:hover:bg-gray-700 ",
        black: "bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 ",
        red: "bg-red-600 hover:bg-red-700 "
    };
    const buttonTexts = {
        default: "text-black dark:text-white ",
        black: "text-white dark:text-black ",
        white: "text-white ",
        red: "text-red-600 hover:text-red-700 dark:hover:text-red-500 "
    };
    const buttonOutlines = {
        default: "border-2 border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500 ",
        red: "border-2 border-red-600 hover:border-red-700 dark:hover:border-red-500 "
    };
    const buttonShapes = {
        regular: "px-5 py-3 min-w-12 ",
        square: "flex-shrink-0 w-12 ",
        wide: "py-3 w-full "
    };
    let buttonFill = buttonFills["default"];
    let buttonText = buttonTexts["default"];
    let buttonOutline = "";
    const buttonShape = buttonShapes[shape];
    if (color === "black") {
        buttonFill = buttonFills[color];
        buttonText = buttonTexts[color];
    }
    else if (color && outline) {
        buttonFill = buttonFills["outline"];
        buttonText = buttonTexts[color];
        buttonOutline = buttonOutlines[color];
    }
    else if (color) {
        buttonFill = buttonFills[color];
        buttonText = buttonTexts["white"];
    }
    else if (outline) {
        buttonOutline = buttonOutlines["default"];
    }
    return (React.createElement("button", { className: `${buttonFill}${buttonText}${buttonOutline}focus:outline-none focus-visible:ring rounded-full font-light flex justify-center items-center gap-2 ${buttonShape}h-12 transition-colors duration-300`, type: "button", title: title, onClick: () => clickEvent === null || clickEvent === void 0 ? void 0 : clickEvent() },
        icon ? React.createElement(Icon, { icon: icon }) : "",
        children));
}
function ConvertRate({ percent }) {
    const circumference = 34.56;
    const offset = 34.56 * (1 - percent);
    const dots = 16;
    const dotAngle = +(360 / dots).toFixed(2);
    const angles = [];
    for (let d = 0; d < dots; ++d) {
        angles.push(dotAngle * d);
    }
    return (React.createElement("div", { className: "col-span-6 sm:col-span-2 lg:col-span-2 lg:row-span-2" },
        React.createElement("div", { className: "bg-black dark:bg-white aspect-square rounded-full text-white dark:text-black relative m-auto max-h-64 sm:max-h-none transition-colors duration-300" },
            React.createElement("svg", { className: "m-auto w-full h-auto rtl:-scale-x-100", viewBox: "0 0 16 16", width: "160px", height: "160px", role: "img", "aria-label": `Ring chart showing a ${Formatter.percent(percent)} fill over a circle made of 16 dots` },
                React.createElement("g", { fill: "currentcolor", transform: "translate(8,8)" },
                    angles.map((angle, i) => (React.createElement("circle", { key: i, r: "0.5", transform: `rotate(${angle}) translate(0,-5.5)` }))),
                    React.createElement("circle", { className: "stroke-red-600", r: "5.5", fill: "none", strokeLinecap: "round", strokeWidth: "1", strokeDasharray: `${circumference} ${circumference}`, strokeDashoffset: offset, transform: "rotate(-90)" }))),
            React.createElement("div", { className: "absolute inset-0 flex flex-col justify-center text-center" },
                React.createElement("div", { className: "text-xl mb-2" }, Formatter.percent(percent)),
                React.createElement("div", { className: "font-thin text-xs" }, "Convert Rate")))));
}
function CustomerCall({ name, vip, source }) {
    const backgroundUrl = "bg-[url(https://assets.codepen.io/416221/customer-call.png)]";
    return (React.createElement("div", { className: `bg-red-600 ${backgroundUrl} bg-right-bottom rtl:bg-left bg-contain bg-no-repeat rounded-2xl col-span-6 sm:col-span-3 lg:row-span-4 flex flex-col justify-between p-5 transition-colors duration-300` },
        React.createElement("div", { className: "text-white mb-10" },
            React.createElement("h2", { className: "font-light mb-2" }, "Customer Call"),
            React.createElement("div", { className: "font-thin text-xs" }, source)),
        React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-xl p-4 transition-colors duration-300" },
            React.createElement("div", { className: "flex items-center gap-3 mb-3" },
                React.createElement(Button, { color: "red", icon: "checkmark", shape: "wide" }, "Accept"),
                React.createElement(Button, { title: "Decline", color: "red", icon: "close", shape: "square", outline: true })),
            React.createElement("div", { className: "bg-gray-100 dark:bg-gray-700 text-black dark:text-white rounded-xl p-4 transition-colors duration-300" },
                React.createElement("div", { className: "mb-2" }, name),
                React.createElement("div", { className: "font-thin text-xs text-gray-600 dark:text-gray-200 transition-colors duration-300" }, vip ? 'VIP Customer' : 'Regular Customer')))));
}
function Dashboard({ data }) {
    const { overview, users, performance, convert_rate, customer_calls, sales_target } = data;
    const { top, sales_goals, number_of_sales, change, total_sales, total_change } = overview;
    const { history } = performance;
    const { target, streams } = sales_target;
    return (React.createElement("div", { className: "m-auto p-6 w-full max-w-screen-2xl" },
        React.createElement(ActionBar, { users: users }),
        React.createElement("div", { className: "grid gap-4 grid-cols-6 lg:grid-cols-12 auto-rows-min" },
            React.createElement(SalesOverview, { top: top, salesGoals: sales_goals, numberOfSales: number_of_sales, change: change, totalSales: total_sales, totalChange: total_change }),
            React.createElement(PerformanceIndex, { history: history }),
            React.createElement(ConvertRate, { percent: convert_rate }),
            React.createElement(CustomerCall, Object.assign({}, customer_calls[0])),
            React.createElement(SalesTarget, { target: target, streams: streams }))));
}
function HalfCirclePie({ percent }) {
    const segments = 14;
    const currentSegmentIndex = Math.floor(percent * segments);
    const segmentAngle = +(180 / segments).toFixed(2);
    const angles = [];
    for (let s = 0; s < segments; ++s) {
        angles.push(segmentAngle / 2 + segmentAngle * s);
    }
    return (React.createElement("svg", { className: "half-circle-pie m-auto rtl:-scale-x-100", viewBox: "0 0 34 17", width: "340px", height: "170px", role: "img", "aria-label": `Half circle chart showing ${currentSegmentIndex} of ${segments} segments filled` }, angles.map((angle, i) => (React.createElement("path", { key: i, className: `${i < currentSegmentIndex ? 'fill-red-600' : 'fill-gray-100 dark:fill-gray-700'} transition-colors duration-300`, d: "M -2.7 -1.5 L 2.7 -0.98 C 3.1 -0.93 3.5 -0.582 3.5 -0.182 L 3.5 0.217 C 3.5 0.629 3.1 0.93 2.7 0.98 L -2.7 1.5 C -3.142 1.5 -3.5 1.142 -3.5 0.7 L -3.5 -0.7 C -3.5 -1.142 -3.142 -1.5 -2.7 -1.5 Z", transform: `translate(17,17) rotate(${angle}) translate(-13.5,0)` })))));
}
function Icon({ icon }) {
    return (React.createElement("svg", { className: "icon", width: "16px", height: "16px", "aria-hidden": "true" },
        React.createElement("use", { href: `#${icon}` })));
}
function IconSprites() {
    const viewBox = "0 0 24 24";
    return (React.createElement("svg", { width: "0", height: "0", display: "none", "aria-hidden": "true" },
        React.createElement("symbol", { id: "arrow-down", viewBox: viewBox },
            React.createElement("g", { fill: "none", stroke: "currentcolor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3" },
                React.createElement("line", { x1: "12", y1: "4", x2: "12", y2: "20" }),
                React.createElement("polyline", { points: "4 12,12 20,20 12" }))),
        React.createElement("symbol", { id: "arrow-up-right", viewBox: viewBox },
            React.createElement("g", { fill: "none", stroke: "currentcolor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3" },
                React.createElement("polyline", { points: "6 6,18 6,18 18" }),
                React.createElement("polyline", { points: "6 18,18 6" }))),
        React.createElement("symbol", { id: "arrow-down-right", viewBox: viewBox },
            React.createElement("g", { fill: "none", stroke: "currentcolor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3" },
                React.createElement("polyline", { points: "6 18,18 18,18 6" }),
                React.createElement("polyline", { points: "6 6,18 18" }))),
        React.createElement("symbol", { id: "calendar", viewBox: viewBox },
            React.createElement("path", { fill: "none", stroke: "currentcolor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3 9H21M7 3V5M17 3V5M6 13H8M6 17H8M11 13H13M11 17H13M16 13H18M16 17H18M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z" })),
        React.createElement("symbol", { id: "checkmark", viewBox: viewBox },
            React.createElement("polyline", { fill: "none", stroke: "currentcolor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3", points: "3 12,8 18,21 6" })),
        React.createElement("symbol", { id: "close", viewBox: viewBox },
            React.createElement("g", { stroke: "currentcolor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3" },
                React.createElement("polyline", { points: "7 7,17 17" }),
                React.createElement("polyline", { points: "17 7,7 17" }))),
        React.createElement("symbol", { id: "crown", viewBox: viewBox },
            React.createElement("path", { fill: "none", stroke: "currentcolor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "3", d: "M4 8L6 20H18L20 8M4 8L5.71624 9.37299C6.83218 10.2657 7.39014 10.7121 7.95256 10.7814C8.4453 10.8421 8.94299 10.7173 9.34885 10.4314C9.81211 10.1051 10.0936 9.4483 10.6565 8.13476L12 5M4 8C4.55228 8 5 7.55228 5 7C5 6.44772 4.55228 6 4 6C3.44772 6 3 6.44772 3 7C3 7.55228 3.44772 8 4 8ZM20 8L18.2838 9.373C17.1678 10.2657 16.6099 10.7121 16.0474 10.7814C15.5547 10.8421 15.057 10.7173 14.6511 10.4314C14.1879 10.1051 13.9064 9.4483 13.3435 8.13476L12 5M20 8C20.5523 8 21 7.55228 21 7C21 6.44772 20.5523 6 20 6C19.4477 6 19 6.44772 19 7C19 7.55228 19.4477 8 20 8ZM12 5C12.5523 5 13 4.55228 13 4C13 3.44772 12.5523 3 12 3C11.4477 3 11 3.44772 11 4C11 4.55228 11.4477 5 12 5ZM12 4H12.01M20 7H20.01M4 7H4.01" })),
        React.createElement("symbol", { id: "ellipsis", viewBox: viewBox },
            React.createElement("g", { fill: "currentcolor" },
                React.createElement("circle", { cx: "4", cy: "12", r: "3" }),
                React.createElement("circle", { cx: "12", cy: "12", r: "3" }),
                React.createElement("circle", { cx: "20", cy: "12", r: "3" }))),
        React.createElement("symbol", { id: "microphone", viewBox: viewBox },
            React.createElement("path", { fill: "none", stroke: "currentcolor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M20 12V13C20 17.4183 16.4183 21 12 21C7.58172 21 4 17.4183 4 13V12M12 17C9.79086 17 8 15.2091 8 13V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V13C16 15.2091 14.2091 17 12 17Z" })),
        React.createElement("symbol", { id: "plus", viewBox: viewBox },
            React.createElement("g", { stroke: "currentcolor", strokeLinecap: "round", strokeWidth: "3" },
                React.createElement("line", { x1: "12", y1: "4", x2: "12", y2: "20" }),
                React.createElement("line", { x1: "4", y1: "12", x2: "20", y2: "12" })))));
}
function PerformanceIndex({ history }) {
    const mostRecent = history.slice(0, -1);
    const latest = history.slice(-1)[0];
    return (React.createElement("div", { className: "bg-white dark:bg-gray-800 col-span-6 sm:col-span-4 lg:col-span-5 lg:row-span-2 rounded-2xl flex flex-col gap-4 p-5 transition-colors duration-300" },
        React.createElement("div", { className: "text-black dark:text-white flex gap-5 justify-between transition-colors duration-300" },
            React.createElement("h2", null, "Your Performance Index"),
            React.createElement("span", { className: "text-3xl font-medium" }, Formatter.percent(latest.percent))),
        React.createElement("div", { className: "bg-gray-100 dark:bg-gray-700 rounded-xl flex flex-1 justify-between px-3 pt-3 min-h-20 transition-colors duration-300" }, mostRecent.map((item, i) => (React.createElement(PerformanceIndexBar, Object.assign({ key: i }, item)))))));
}
function PerformanceIndexBar({ date, percent }) {
    const barID = Random.hash();
    const barStyle = {
        transform: `translateY(${100 - (15 + (percent * 85))}%)`
    };
    const tipStyle = {
        bottom: `${15 + (percent * 85)}%`
    };
    return (React.createElement("div", { className: "w-2 sm:w-3 h-full relative", "aria-labelledby": `bar-${barID}-percent bar-${barID}-date` },
        React.createElement("div", { className: "group peer overflow-hidden w-full h-full" },
            React.createElement("div", { className: "bg-gray-300 dark:bg-gray-500 group-hover:bg-red-600 rounded-t-full w-full h-full transition duration-300 translate-y-full", style: barStyle })),
        React.createElement("span", { className: "bg-black dark:bg-white rounded-full text-white dark:text-black absolute bottom-0 left-1.5 text-xs opacity-0 invisible text-nowrap mb-2 px-2 py-1 pointer-events-none -translate-x-1/2 z-10 transition duration-300 peer-has-[:hover]:opacity-100 peer-has-[:hover]:visible", style: tipStyle },
            React.createElement("strong", { id: `bar-${barID}-percent`, className: "font-semibold" }, Formatter.percent(percent)),
            " ",
            React.createElement("span", { id: `bar-${barID}-date` },
                "(",
                Formatter.date(date),
                ")"))));
}
function PerformanceRank({ percent }) {
    return (React.createElement("div", { className: "bg-gray-100 dark:bg-gray-700 rounded-xl flex gap-3 mb-9 px-4 py-5 transition-colors duration-300" },
        React.createElement("span", { className: "text-red-600 dark:text-red-400 text-2xl transition-colors duration-300" },
            React.createElement(Icon, { icon: "crown" })),
        React.createElement("p", { className: "text-black dark:text-white font-light transition-colors duration-300" },
            "You\u2019re the top ",
            React.createElement("strong", { className: "font-medium text-red-700 dark:text-red-300 transition-colors duration-300" }, Formatter.percent(percent)),
            " of performers")));
}
function SalesOverview({ top, salesGoals, numberOfSales, change, totalSales, totalChange }) {
    return (React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-2xl col-span-6 lg:col-span-5 lg:row-span-6 p-5 transition-colors duration-300" },
        React.createElement(WidgetHeader, null,
            React.createElement("h1", { className: "text-black dark:text-white text-3xl transition-colors duration-300" }, "Sales Overview")),
        React.createElement(PerformanceRank, { percent: top }),
        React.createElement("div", { className: "relative mb-10" },
            React.createElement(HalfCirclePie, { percent: salesGoals }),
            React.createElement("div", { className: "text-black dark:text-white absolute bottom-0 left-0 w-full text-center transition-colors duration-300" },
                React.createElement("div", { className: "text-2xl sm:text-4xl font-medium mb-2" }, Formatter.percent(salesGoals)),
                React.createElement("div", { className: "text-xs font-light" }, "Sales Goals"))),
        React.createElement("div", { className: "grid sm:grid-cols-2 gap-4" },
            React.createElement(SalesOverviewStat, { sales: numberOfSales, change: change }),
            React.createElement(SalesOverviewStat, { sales: totalSales, change: totalChange, isCurrency: true }))));
}
function SalesOverviewStat({ sales, isCurrency, change }) {
    const notLoss = change >= 0;
    return (React.createElement("div", { className: "bg-gray-100 dark:bg-gray-700 text-black dark:text-white rounded-xl flex flex-col justify-between p-4 transition-colors duration-300" },
        React.createElement("div", { className: "flex justify-between items-start gap-6 mb-4" },
            React.createElement("span", { className: "text-xs font-light" }, isCurrency ? "Total Sales" : "Number of Sales"),
            React.createElement("span", { className: `${notLoss ? 'bg-red-600' : 'bg-black dark:bg-white'} rounded-full flex justify-center items-center gap-1 text-xs font-light text-white${notLoss ? '' : ' dark:text-black'} px-2 py-1 transition-colors duration-300` },
                Formatter.percent(Math.abs(change)),
                React.createElement("span", { className: "rtl:-scale-x-100" },
                    React.createElement(Icon, { icon: notLoss ? "arrow-up-right" : "arrow-down-right" })),
                React.createElement("span", { className: "sr-only" }, notLoss ? "up" : "down"))),
        React.createElement("div", { className: "text-3xl font-medium" }, isCurrency ? Formatter.currency(sales) : Formatter.count(sales))));
}
function SalesTarget({ target, streams }) {
    const topStreams = streams.slice(0, 4);
    const mostRevenue = topStreams.map(stream => stream.revenue).sort((a, b) => b - a)[0];
    const maxRevenue = Math.ceil(mostRevenue / 5e3) * 5e3;
    return (React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-2xl col-span-6 sm:col-span-3 lg:col-span-4 lg:row-span-4 flex flex-col p-5 transition-colors duration-300" },
        React.createElement(WidgetHeader, null,
            React.createElement("h2", { className: "text-black dark:text-white w-1/2 transition-colors duration-300" }, "Sales Target by Revenue Streams")),
        React.createElement("div", { className: "text-black dark:text-white text-3xl font-medium mb-4 transition-colors duration-300" }, Formatter.currency(target)),
        React.createElement("div", { className: "grid grid-cols-4 gap-3 mt-auto" }, topStreams.map((stream, i) => (React.createElement(SalesTargetStream, Object.assign({ key: i, maxRevenue: maxRevenue }, stream)))))));
}
function SalesTargetStream({ change, revenue, maxRevenue, source }) {
    const notLoss = change >= 0;
    const percent = 1 - revenue / maxRevenue;
    const barStyle = {
        transform: `translateY(${percent * 100}%)`
    };
    const barWrapHeight = 8;
    const barWrapStyle = {
        height: `${barWrapHeight}rem`
    };
    const tagStyle = {
        transform: `translateY(${Math.min(barWrapHeight - 2.25, percent * barWrapHeight)}rem)`
    };
    return (React.createElement("div", { className: "group text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white w-full transition-colors duration-300" },
        React.createElement("div", { className: "flex items-center gap-0.5 mb-2" },
            Formatter.percent(Math.abs(change)),
            React.createElement("span", { className: "rtl:-scale-x-100" },
                React.createElement(Icon, { icon: notLoss ? "arrow-up-right" : "arrow-down-right" })),
            React.createElement("span", { className: "sr-only" }, notLoss ? "up" : "down")),
        React.createElement("div", { className: "relative mb-2" },
            React.createElement("div", { className: "bg-gray-100 dark:bg-gray-700 rounded-lg h-20 overflow-hidden transition-colors duration-300", style: barWrapStyle },
                React.createElement("div", { className: "bg-gray-300 dark:bg-gray-500 group-hover:bg-red-600 rounded-lg w-full h-full translate-y-full transition duration-300", style: barStyle })),
            React.createElement("span", { className: "bg-red-600 group-hover:bg-black dark:group-hover:bg-white rounded-full text-xs font-light text-white dark:group-hover:text-black px-2 py-1 absolute top-1.5 -left-2.5 rtl:-right-2.5 rtl:left-auto transition duration-300", style: tagStyle }, Formatter.currency(revenue))),
        React.createElement("div", { className: "text-sm truncate" }, source)));
}
function WidgetHeader({ children }) {
    return (React.createElement("div", { className: "flex justify-between gap-5 mb-6" },
        children,
        React.createElement(Button, { title: "Options", icon: "ellipsis", shape: "square", outline: true })));
}