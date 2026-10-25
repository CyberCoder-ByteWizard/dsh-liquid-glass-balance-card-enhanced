// dsh-liquid-glass-balance-card-enhanced — browser half.
//
// A draggable liquid-glass floating card pinned to the top-right corner of the
// DSH web GUI (registered into the frame-wide `shell.overlay` slot). It polls
// the host route `/api/liquid-glass-balance-card-enhanced/balance`, supports a manual API
// key in its settings popover, and remembers its dragged position in
// localStorage.
//
// The bundle is a CJS closure-factory consumed by DSH's client module loader.
window.__ModuleLoader__.load({
	id: "dsh-liquid-glass-balance-card-enhanced",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let jsxRuntime = require("react/jsx-runtime");
		const { useState, useEffect, useLayoutEffect, useCallback, useRef } = react;
		const { jsx, jsxs, Fragment } = jsxRuntime;

		// ---- constants -------------------------------------------------
		const POLL_MS = 60 * 1000;
		const SETTINGS_PATH = "/api/liquid-glass-balance-card-enhanced/settings";
		const BALANCE_PATH = "/api/liquid-glass-balance-card-enhanced/balance";
		const STATS_PATH = "/api/liquid-glass-balance-card-enhanced/stats";
		const RANGE_LABELS = { today: "今天", yesterday: "昨天", "7d": "近7天", "30d": "近30天" };
		const POSITION_KEY = "dsh-liquid-glass-balance-card-enhanced-pos";
		const GLASS_KEY = "dsh-liquid-glass-balance-card-enhanced-glass";
		const DEFAULT_GLASS = {
			alpha: 14,
			blur: 4,
			saturate: 140,
			highlight: 0.35,
			shine: 0.14,
			enable3d: true,
			thickness: 12,
			angle: 12,
			colorEnabled: false,
			color: "#4f8cff",
			colorStrength: 30,
			cardWidth: 264,
			cardHeight: 0
		};
		const THEME_KEY = "dsh-liquid-glass-balance-card-enhanced-theme";
		const THEME_GROUPS = ["默认", "亮色", "暗调"];
		// 每套主题一整套纸面：实色皮肤不依赖液态玻璃，直接给出底色 / 描边 / 阴影 /
		// 强调色；同时覆盖 DSH 的 --dsw-* 语义色，保证卡片内部所有部件同一套色。
		const THEMES = [
			{
				id: "glass",
				name: "液态玻璃",
				group: "默认",
				mode: "glass",
				dot: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(79,140,255,0.6))",
				vars: {}
			},
			{
				id: "paper",
				name: "纸白",
				group: "亮色",
				mode: "solid",
				dot: "linear-gradient(160deg, #ffffff, #e9e9e2)",
				vars: {
					"--dsbce-accent": "#1f2226",
					"--dsbce-accent-contrast": "#ffffff",
					"--dsbce-accent-soft": "rgba(23,24,27,0.08)",
					"--dsbce-solid-bg": "linear-gradient(165deg, #ffffff 0%, #f3f3ee 100%)",
					"--dsbce-bar-base": "#ffffff",
					"--dsbce-solid-panel": "rgba(23,24,27,0.05)",
					"--dsbce-solid-hover": "rgba(23,24,27,0.06)",
					"--dsbce-solid-border": "rgba(23,24,27,0.10)",
					"--dsbce-solid-glow": "rgba(255,255,255,0.95)",
					"--dsbce-solid-shadow": "0 1px 2px rgba(23,24,27,0.06), 0 12px 30px rgba(23,24,27,0.12)",
					"--dsbce-slider-track": "rgba(23,24,27,0.12)",
					"--dsw-alias-label-primary": "#14161a",
					"--dsw-alias-label-secondary": "#5b6068",
					"--dsw-alias-label-tertiary": "#767c86",
					"--dsw-alias-label-link": "#1f2226",
					"--dsw-alias-bg-overlay": "#ffffff",
					"--dsw-alias-bg-field": "#ffffff",
					"--dsw-alias-border-l1": "rgba(23,24,27,0.08)",
					"--dsw-alias-border-l2": "rgba(23,24,27,0.16)",
					"--dsw-alias-interactive-bg-hover": "rgba(23,24,27,0.06)",
					"--dsw-alias-state-success-primary": "#127a3d",
					"--dsw-alias-state-error-primary": "#c22a2a"
				}
			},
			{
				id: "mist",
				name: "晨雾",
				group: "亮色",
				mode: "solid",
				dot: "linear-gradient(160deg, #f8fbff, #dbe8fb)",
				vars: {
					"--dsbce-accent": "#2f6bff",
					"--dsbce-accent-contrast": "#ffffff",
					"--dsbce-accent-soft": "rgba(47,107,255,0.12)",
					"--dsbce-solid-bg": "linear-gradient(160deg, #f8fbff 0%, #e7effc 100%)",
					"--dsbce-bar-base": "#f2f7ff",
					"--dsbce-solid-panel": "rgba(47,107,255,0.08)",
					"--dsbce-solid-hover": "rgba(47,107,255,0.10)",
					"--dsbce-solid-border": "rgba(30,60,110,0.12)",
					"--dsbce-solid-glow": "rgba(255,255,255,0.85)",
					"--dsbce-solid-shadow": "0 1px 2px rgba(33,64,120,0.06), 0 14px 32px rgba(33,64,120,0.16)",
					"--dsbce-slider-track": "rgba(47,107,255,0.18)",
					"--dsw-alias-label-primary": "#16202c",
					"--dsw-alias-label-secondary": "#55637a",
					"--dsw-alias-label-tertiary": "#6d7c94",
					"--dsw-alias-label-link": "#2f6bff",
					"--dsw-alias-bg-overlay": "#f4f8ff",
					"--dsw-alias-bg-field": "#ffffff",
					"--dsw-alias-border-l1": "rgba(30,60,110,0.10)",
					"--dsw-alias-border-l2": "rgba(30,60,110,0.18)",
					"--dsw-alias-interactive-bg-hover": "rgba(47,107,255,0.10)",
					"--dsw-alias-state-success-primary": "#0f7a45",
					"--dsw-alias-state-error-primary": "#c22a2a"
				}
			},
			{
				id: "cream",
				name: "奶油",
				group: "亮色",
				mode: "solid",
				dot: "linear-gradient(160deg, #fffaf1, #f0dfc4)",
				vars: {
					"--dsbce-accent": "#a9661a",
					"--dsbce-accent-contrast": "#ffffff",
					"--dsbce-accent-soft": "rgba(169,102,26,0.14)",
					"--dsbce-solid-bg": "linear-gradient(160deg, #fffaf1 0%, #f6ebd8 100%)",
					"--dsbce-bar-base": "#fff8ec",
					"--dsbce-solid-panel": "rgba(120,80,30,0.07)",
					"--dsbce-solid-hover": "rgba(120,80,30,0.09)",
					"--dsbce-solid-border": "rgba(94,68,33,0.14)",
					"--dsbce-solid-glow": "rgba(255,255,255,0.90)",
					"--dsbce-solid-shadow": "0 1px 2px rgba(94,68,33,0.06), 0 14px 32px rgba(94,68,33,0.16)",
					"--dsbce-slider-track": "rgba(120,80,30,0.18)",
					"--dsw-alias-label-primary": "#2c2318",
					"--dsw-alias-label-secondary": "#6b5c46",
					"--dsw-alias-label-tertiary": "#857558",
					"--dsw-alias-label-link": "#a9661a",
					"--dsw-alias-bg-overlay": "#fff8ec",
					"--dsw-alias-bg-field": "#fffdf9",
					"--dsw-alias-border-l1": "rgba(94,68,33,0.12)",
					"--dsw-alias-border-l2": "rgba(94,68,33,0.20)",
					"--dsw-alias-interactive-bg-hover": "rgba(120,80,30,0.09)",
					"--dsw-alias-state-success-primary": "#0f7a45",
					"--dsw-alias-state-error-primary": "#c22a2a"
				}
			},
			{
				id: "midnight",
				name: "静夜",
				group: "暗调",
				mode: "solid",
				dot: "linear-gradient(160deg, #23262c, #101216)",
				vars: {
					"--dsbce-accent": "#7aa2ff",
					"--dsbce-accent-contrast": "#0b1020",
					"--dsbce-accent-soft": "rgba(122,162,255,0.16)",
					"--dsbce-solid-bg": "#15171c",
					"--dsbce-bar-base": "#0f1115",
					"--dsbce-solid-panel": "rgba(255,255,255,0.05)",
					"--dsbce-solid-hover": "rgba(255,255,255,0.08)",
					"--dsbce-solid-border": "rgba(255,255,255,0.09)",
					"--dsbce-solid-glow": "rgba(122,162,255,0.10)",
					"--dsbce-solid-shadow": "inset 0 1px 0 rgba(255,255,255,0.04), 0 16px 36px rgba(0,0,0,0.50)",
					"--dsbce-slider-track": "rgba(255,255,255,0.12)",
					"--dsw-alias-label-primary": "#e9ebf0",
					"--dsw-alias-label-secondary": "#a5acb8",
					"--dsw-alias-label-tertiary": "#767e8c",
					"--dsw-alias-label-link": "#8fb0ff",
					"--dsw-alias-bg-overlay": "#1a1d23",
					"--dsw-alias-bg-field": "#1e2229",
					"--dsw-alias-border-l1": "rgba(255,255,255,0.09)",
					"--dsw-alias-border-l2": "rgba(255,255,255,0.16)",
					"--dsw-alias-interactive-bg-hover": "rgba(255,255,255,0.08)",
					"--dsw-alias-state-success-primary": "#4ade80",
					"--dsw-alias-state-error-primary": "#f87171"
				}
			},
			{
				id: "deepspace",
				name: "深空",
				group: "暗调",
				mode: "solid",
				dot: "radial-gradient(120% 120% at 15% 0%, #2a4a7a, #0a0f19 70%)",
				vars: {
					"--dsbce-accent": "#5eead4",
					"--dsbce-accent-contrast": "#06251f",
					"--dsbce-accent-soft": "rgba(94,234,212,0.16)",
					"--dsbce-solid-bg": "radial-gradient(125% 130% at 12% -10%, #1d3357 0%, #101827 45%, #090e17 100%)",
					"--dsbce-bar-base": "#0a1018",
					"--dsbce-solid-panel": "rgba(94,234,212,0.07)",
					"--dsbce-solid-hover": "rgba(140,180,255,0.10)",
					"--dsbce-solid-border": "rgba(120,170,255,0.16)",
					"--dsbce-solid-glow": "rgba(94,234,212,0.14)",
					"--dsbce-solid-shadow": "inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 40px rgba(3,8,18,0.60)",
					"--dsbce-slider-track": "rgba(160,190,255,0.16)",
					"--dsw-alias-label-primary": "#e3ecff",
					"--dsw-alias-label-secondary": "#9fb0cc",
					"--dsw-alias-label-tertiary": "#6d7f9c",
					"--dsw-alias-label-link": "#7dd3fc",
					"--dsw-alias-bg-overlay": "#111a2a",
					"--dsw-alias-bg-field": "#162133",
					"--dsw-alias-border-l1": "rgba(120,170,255,0.14)",
					"--dsw-alias-border-l2": "rgba(120,170,255,0.22)",
					"--dsw-alias-interactive-bg-hover": "rgba(140,180,255,0.10)",
					"--dsw-alias-state-success-primary": "#4ade80",
					"--dsw-alias-state-error-primary": "#fb7185"
				}
			},
			{
				id: "neon",
				name: "霓虹",
				group: "暗调",
				mode: "solid",
				dot: "radial-gradient(120% 120% at 85% 0%, #6d3bd6, #0a0713 75%)",
				vars: {
					"--dsbce-accent": "#a78bfa",
					"--dsbce-accent-contrast": "#150a2b",
					"--dsbce-accent-soft": "rgba(167,139,250,0.18)",
					"--dsbce-solid-bg": "radial-gradient(130% 120% at 85% -10%, #2a1550 0%, #120c22 55%, #07060e 100%)",
					"--dsbce-bar-base": "#0a0713",
					"--dsbce-solid-panel": "rgba(167,139,250,0.08)",
					"--dsbce-solid-hover": "rgba(255,255,255,0.10)",
					"--dsbce-solid-border": "rgba(167,139,250,0.24)",
					"--dsbce-solid-glow": "rgba(167,139,250,0.22)",
					"--dsbce-solid-shadow": "inset 0 1px 0 rgba(255,255,255,0.06), 0 16px 40px rgba(40,10,90,0.55)",
					"--dsbce-slider-track": "rgba(167,139,250,0.20)",
					"--dsw-alias-label-primary": "#f2ecff",
					"--dsw-alias-label-secondary": "#b3a6d6",
					"--dsw-alias-label-tertiary": "#8277a3",
					"--dsw-alias-label-link": "#c4b5fd",
					"--dsw-alias-bg-overlay": "#150e26",
					"--dsw-alias-bg-field": "#1b1230",
					"--dsw-alias-border-l1": "rgba(167,139,250,0.16)",
					"--dsw-alias-border-l2": "rgba(167,139,250,0.26)",
					"--dsw-alias-interactive-bg-hover": "rgba(255,255,255,0.10)",
					"--dsw-alias-state-success-primary": "#4ade80",
					"--dsw-alias-state-error-primary": "#fb7185"
				}
			}
		];
		const CARD_WIDTH = 264;
		const CARD_HEIGHT = 180;

		// ---- small helpers ---------------------------------------------
		function currencySymbol(code) {
			switch (code) {
				case "CNY": return "¥";
				case "USD": return "$";
				case "EUR": return "€";
				case "JPY": return "¥";
				case "HKD": return "HK$";
				default: return code ? `${code} ` : "";
			}
		}

		function formatBalance(value, currency) {
			const symbol = currencySymbol(currency);
			return `${symbol}${String(value)}`;
		}

		function formatCost(value, currency) {
			const symbol = currencySymbol(currency);
			if (!Number.isFinite(value) || value <= 0) return `${symbol}0`;
			if (value >= 100) return `${symbol}${value.toFixed(0)}`;
			if (value >= 1) return `${symbol}${value.toFixed(2)}`;
			if (value >= 0.01) return `${symbol}${value.toFixed(3)}`;
			return `${symbol}${value.toPrecision(2)}`;
		}

		function formatTokens(value) {
			const n = Number.isFinite(value) ? Math.round(value) : 0;
			return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}

		function formatTime(date) {
			const hh = String(date.getHours()).padStart(2, "0");
			const mm = String(date.getMinutes()).padStart(2, "0");
			const ss = String(date.getSeconds()).padStart(2, "0");
			return `${hh}:${mm}:${ss}`;
		}

		function clamp(value, min, max) {
			return Math.min(max, Math.max(min, value));
		}

		function loadPosition() {
			try {
				const raw = localStorage.getItem(POSITION_KEY);
				if (raw) {
					const p = JSON.parse(raw);
					if (
						p !== null &&
						typeof p === "object" &&
						typeof p.x === "number" &&
						typeof p.y === "number" &&
						Number.isFinite(p.x) &&
						Number.isFinite(p.y)
					) {
						return { x: p.x, y: p.y };
					}
				}
			} catch {}
			return null;
		}

		function loadGlass() {
			try {
				const raw = localStorage.getItem(GLASS_KEY);
				if (raw) {
					const g = JSON.parse(raw);
					if (g !== null && typeof g === "object") {
						const out = { ...DEFAULT_GLASS };
						for (const key of Object.keys(DEFAULT_GLASS)) {
							const value = g[key];
							if (typeof value === "number" && Number.isFinite(value)) {
								out[key] = value;
							} else if (typeof value === "boolean" && (key === "enable3d" || key === "colorEnabled")) {
								out[key] = value;
							} else if (typeof value === "string" && key === "color" && /^#[0-9a-fA-F]{6}$/.test(value)) {
								out[key] = value;
							}
						}
						out.alpha = clamp(out.alpha, 0, 80);
						out.blur = clamp(out.blur, 0, 40);
						out.saturate = clamp(out.saturate, 100, 300);
						out.highlight = clamp(out.highlight, 0, 1);
						out.shine = clamp(out.shine, 0, 0.5);
						out.thickness = clamp(out.thickness, 0, 40);
						out.angle = clamp(out.angle, -30, 30);
						out.colorStrength = clamp(out.colorStrength, 0, 100);
						out.cardWidth = clamp(out.cardWidth, 220, 420);
						out.cardHeight = clamp(out.cardHeight, 0, 400);
						return out;
					}
				}
			} catch {}
			return { ...DEFAULT_GLASS };
		}

		function loadTheme() {
			try {
				const raw = localStorage.getItem(THEME_KEY);
				if (typeof raw === "string" && THEMES.some((t) => t.id === raw)) return raw;
			} catch {}
			return "glass";
		}

		function GlassSlider(props) {
			const { label, value, min, max, step, unit, onChange, disabled } = props;
			return jsxs("label", {
				className: "dsbce-slider" + (disabled ? " dsbce-disabled" : ""),
				children: [
					jsxs("span", {
						className: "dsbce-slider-head",
						children: [
							jsx("span", { children: label }),
							jsx("span", { className: "dsbce-slider-value", children: `${value}${unit || ""}` })
						]
					}),
					jsx("input", {
						type: "range",
						min: String(min),
						max: String(max),
						step: String(step),
						value: String(value),
						disabled: disabled === true,
						onChange: (e) => onChange(Number(e.target.value))
					})
				]
			});
		}

		// ---- injected glass styles -------------------------------------
		function injectStyles() {
			const style = document.createElement("style");
			style.textContent = `
				.dsbce-card {
					--dsbce-alpha: 14%;
					--dsbce-alpha2: 7%;
					--dsbce-blur: 4px;
					--dsbce-saturate: 140%;
					--dsbce-highlight: 0.35;
					--dsbce-highlight-weak: 0.07;
					--dsbce-shine: 0.14;
					--dsbce-tint: var(--dsw-alias-bg-overlay, #ffffff);
					--dsbce-layer-alpha: 28%;
					--dsbce-layer-alpha2: 14%;
					--dsbce-thickness: 0px;
					--dsbce-angle: 0deg;
					--dsbce-accent: #4f8cff;
					--dsbce-accent-contrast: #ffffff;
					--dsbce-accent-soft: rgba(79, 140, 255, 0.16);
					position: fixed;
					z-index: 9999;
					box-sizing: border-box;
					width: 264px;
					font-family: inherit;
					user-select: none;
					-webkit-user-select: none;
					transform-style: preserve-3d;
					will-change: transform;
					transition: transform 0.2s ease;
				}
				.dsbce-card-content {
					position: relative;
					z-index: 1;
					box-sizing: border-box;
					width: 100%;
					min-height: var(--dsbce-min-height, 0px);
					border-radius: 20px;
					padding: 14px 16px 12px;
					font-size: 12px;
					line-height: 18px;
					color: var(--dsw-alias-label-primary, #1f2328);
					background: var(--dsw-alias-bg-overlay, rgba(255, 255, 255, 0.65));
					border: 1px solid rgba(255, 255, 255, 0.45);
					box-shadow:
						inset 0 1px 0 rgba(255, 255, 255, 0.45),
						inset 0 -1px 0 rgba(255, 255, 255, 0.06),
						inset 0 0 0 1px rgba(255, 255, 255, 0.08),
						0 8px 32px rgba(0, 0, 0, 0.18);
					overflow: hidden;
					transition: box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease, color 0.25s ease;
				}
				.dsbce-3d-layer {
					position: absolute;
					inset: 0;
					border-radius: 20px;
					pointer-events: none;
					background: linear-gradient(
						135deg,
						color-mix(in srgb, var(--dsbce-tint, var(--dsw-alias-bg-overlay, #ffffff)) var(--dsbce-layer-alpha, 28%), transparent),
						color-mix(in srgb, var(--dsbce-tint, var(--dsw-alias-bg-overlay, #ffffff)) var(--dsbce-layer-alpha2, 14%), transparent)
					);
					border: 1px solid color-mix(in srgb, var(--dsbce-tint, var(--dsw-alias-bg-overlay, #ffffff)) var(--dsbce-layer-alpha2, 14%), transparent);
					z-index: 0;
					transform-style: preserve-3d;
				}
				.dsbce-card-content::before {
					content: "";
					position: absolute;
					inset: 0;
					border-radius: inherit;
					pointer-events: none;
					background:
						radial-gradient(120% 80% at 15% 0%, rgba(255, 255, 255, var(--dsbce-highlight, 0.35)) 0%, rgba(255, 255, 255, var(--dsbce-highlight-weak, 0.07)) 42%, transparent 70%),
						linear-gradient(135deg, rgba(255, 255, 255, var(--dsbce-highlight-weak, 0.07)) 0%, rgba(255, 255, 255, 0.01) 45%, rgba(255, 255, 255, var(--dsbce-highlight-weak, 0.05)) 100%);
					z-index: 0;
				}
				.dsbce-card-content::after {
					content: "";
					position: absolute;
					top: -60%;
					left: -80%;
					width: 45%;
					height: 220%;
					pointer-events: none;
					background: linear-gradient(100deg, transparent, rgba(255, 255, 255, var(--dsbce-shine, 0.14)), transparent);
					transform: rotate(25deg);
					opacity: 0;
					z-index: 2;
					animation: dsbce-shine 6s ease-in-out infinite;
				}
				.dsbce-card-content > * {
					position: relative;
					z-index: 1;
				}
				@keyframes dsbce-shine {
					0%, 55% {
						transform: translateX(-160%) rotate(25deg);
						opacity: 0;
					}
					62% {
						opacity: 1;
					}
					80%, 100% {
						transform: translateX(380%) rotate(25deg);
						opacity: 0;
					}
				}
				@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
					.dsbce-card-content {
						background: linear-gradient(
							135deg,
							color-mix(in srgb, var(--dsbce-tint, var(--dsw-alias-bg-overlay, #ffffff)) var(--dsbce-alpha, 14%), transparent),
							color-mix(in srgb, var(--dsbce-tint, var(--dsw-alias-bg-overlay, #ffffff)) var(--dsbce-alpha2, 7%), transparent)
						);
						-webkit-backdrop-filter: blur(var(--dsbce-blur, 4px)) saturate(var(--dsbce-saturate, 140%));
						backdrop-filter: blur(var(--dsbce-blur, 4px)) saturate(var(--dsbce-saturate, 140%));
						border-color: color-mix(in srgb, var(--dsbce-tint, var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.6))) 35%, transparent);
					}
				}
				@media (prefers-reduced-motion: reduce) {
					.dsbce-card-content::after {
						display: none;
					}
				}
				.dsbce-header {
					display: flex;
					align-items: center;
					gap: 6px;
					margin-bottom: 8px;
				}
				.dsbce-drag {
					flex: none;
					cursor: grab;
					padding: 2px 4px;
					border-radius: 6px;
					font-size: 14px;
					line-height: 1;
					letter-spacing: -2px;
					color: var(--dsw-alias-label-tertiary, #8b949e);
				}
				.dsbce-drag:active {
					cursor: grabbing;
				}
				.dsbce-title {
					flex: 1;
					min-width: 0;
					font-weight: 600;
					font-size: 13px;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
				.dsbce-icon-btn {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					width: 24px;
					height: 24px;
					border: 0;
					border-radius: 8px;
					background: transparent;
					color: var(--dsw-alias-label-secondary, #57606a);
					cursor: pointer;
					padding: 0;
				}
				.dsbce-icon-btn:hover {
					background: linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.1));
					-webkit-backdrop-filter: blur(6px);
					backdrop-filter: blur(6px);
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 1px 3px rgba(0, 0, 0, 0.06);
				}
				.dsbce-icon-btn:disabled {
					opacity: 0.5;
					cursor: default;
				}
				.dsbce-icon-btn svg {
					display: block;
				}
				@keyframes dsbce-spin {
					to {
						transform: rotate(360deg);
					}
				}
				.dsbce-balance-row {
					display: flex;
					align-items: baseline;
					gap: 8px;
				}
				.dsbce-balance-value {
					font-size: 24px;
					line-height: 32px;
					font-weight: 700;
					font-variant-numeric: tabular-nums;
					white-space: nowrap;
				}
				.dsbce-chip {
					flex: none;
					border-radius: 999px;
					padding: 0 8px;
					font-size: 10px;
					line-height: 16px;
				}
				.dsbce-meta {
					display: flex;
					gap: 8px;
					margin-top: 6px;
					color: var(--dsw-alias-label-secondary, #57606a);
					font-size: 11px;
					line-height: 16px;
					white-space: nowrap;
					overflow: hidden;
				}
				.dsbce-meta span {
					overflow: hidden;
					text-overflow: ellipsis;
				}
				.dsbce-updated {
					margin-top: 2px;
					color: var(--dsw-alias-label-tertiary, #8b949e);
					font-size: 10px;
					line-height: 14px;
					font-variant-numeric: tabular-nums;
				}
				.dsbce-error {
					color: var(--dsw-alias-state-error-primary, #cf222e);
					font-size: 11px;
					line-height: 16px;
					word-break: break-word;
				}
				.dsbce-loading {
					color: var(--dsw-alias-label-secondary, #57606a);
				}
				.dsbce-settings {
					margin-top: 8px;
					padding: 10px 12px;
					border-radius: 12px;
					background: color-mix(in srgb, var(--dsw-alias-bg-overlay, #ffffff) 62%, transparent);
					border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.06));
					display: flex;
					flex-direction: column;
					gap: 8px;
					max-height: min(60vh, 420px);
					overflow-y: auto;
					overscroll-behavior: contain;
					scrollbar-width: thin;
					scrollbar-color: rgba(255, 255, 255, 0.45) transparent;
				}
				.dsbce-settings::-webkit-scrollbar {
					width: 6px;
				}
				.dsbce-settings::-webkit-scrollbar-thumb {
					background: linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.2));
					border: 1px solid rgba(255, 255, 255, 0.3);
					border-radius: 3px;
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 1px 2px rgba(0, 0, 0, 0.08);
				}
				.dsbce-settings::-webkit-scrollbar-track {
					background: transparent;
				}
				.dsbce-settings-title {
					font-weight: 600;
				}
				.dsbce-settings-info {
					font-size: 10px;
					line-height: 14px;
					color: var(--dsw-alias-label-secondary, #57606a);
					word-break: break-word;
				}
				.dsbce-settings input:not([type="range"]) {
					box-sizing: border-box;
					width: 100%;
					padding: 6px 8px;
					border-radius: 8px;
					border: 1px solid rgba(255, 255, 255, 0.35);
					background: color-mix(in srgb, var(--dsw-alias-bg-field, #ffffff) 55%, transparent);
					-webkit-backdrop-filter: blur(6px);
					backdrop-filter: blur(6px);
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
					color: var(--dsw-alias-label-primary, #1f2328);
					font-size: 12px;
				}
				.dsbce-settings-actions {
					display: flex;
					gap: 8px;
				}
				.dsbce-settings-actions button {
					padding: 4px 10px;
					border-radius: 8px;
					border: 1px solid rgba(255, 255, 255, 0.35);
					background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.08));
					-webkit-backdrop-filter: blur(6px);
					backdrop-filter: blur(6px);
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 1px 4px rgba(0, 0, 0, 0.08);
					color: var(--dsw-alias-label-primary, #1f2328);
					cursor: pointer;
					font-size: 11px;
					transition: background 0.2s ease, box-shadow 0.2s ease;
				}
				.dsbce-settings-actions button:hover:not(:disabled) {
					background: linear-gradient(135deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.14));
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 2px 6px rgba(0, 0, 0, 0.1);
				}
				.dsbce-settings-actions button:disabled {
					opacity: 0.5;
					cursor: default;
				}
				.dsbce-settings-msg {
					font-size: 10px;
					line-height: 14px;
				}
				.dsbce-settings-msg-ok {
					color: var(--dsw-alias-state-success-primary, #1a7f37);
				}
				.dsbce-settings-msg-error {
					color: var(--dsw-alias-state-error-primary, #cf222e);
				}
				.dsbce-section {
					margin-top: 6px;
					padding-top: 8px;
					border-top: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.06));
					display: flex;
					flex-direction: column;
					gap: 8px;
				}
				.dsbce-slider {
					display: flex;
					flex-direction: column;
					gap: 4px;
				}
				.dsbce-slider-head {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 8px;
					font-size: 11px;
					line-height: 16px;
				}
				.dsbce-slider-value {
					color: var(--dsw-alias-label-secondary, #57606a);
					font-variant-numeric: tabular-nums;
					white-space: nowrap;
				}
				.dsbce-slider {
					position: relative;
					z-index: 2;
				}
				.dsbce-slider input[type="range"] {
					-webkit-appearance: none;
					appearance: none;
					box-sizing: border-box;
					position: relative;
					z-index: 3;
					pointer-events: auto;
					touch-action: none;
					width: 100%;
					height: 20px;
					margin: 0;
					padding: 0;
					background: transparent;
					cursor: pointer;
				}
				.dsbce-slider input[type="range"]::-webkit-slider-runnable-track {
					height: 4px;
					border-radius: 999px;
					background: linear-gradient(90deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.06));
					border: 1px solid rgba(255, 255, 255, 0.16);
					box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12);
				}
				.dsbce-slider input[type="range"]::-webkit-slider-thumb {
					-webkit-appearance: none;
					appearance: none;
					width: 16px;
					height: 16px;
					margin-top: -7px;
					border-radius: 50%;
					border: 1px solid rgba(255, 255, 255, 0.85);
					background:
						radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.4) 38%, rgba(255, 255, 255, 0.12) 100%);
					box-shadow:
						inset 0 1px 2px rgba(255, 255, 255, 0.85),
						inset 0 -2px 4px rgba(255, 255, 255, 0.12),
						0 2px 8px rgba(0, 0, 0, 0.25),
						0 0 0 3px rgba(255, 255, 255, 0.12);
					transition: transform 0.15s ease, box-shadow 0.15s ease;
				}
				.dsbce-slider input[type="range"]::-webkit-slider-thumb:hover {
					transform: scale(1.12);
					box-shadow:
						inset 0 1px 3px rgba(255, 255, 255, 0.95),
						inset 0 -2px 5px rgba(255, 255, 255, 0.15),
						0 3px 12px rgba(0, 0, 0, 0.3),
						0 0 0 4px rgba(255, 255, 255, 0.16);
				}
				.dsbce-slider input[type="range"]::-webkit-slider-thumb:active {
					transform: scale(0.96);
				}
				.dsbce-slider input[type="range"]::-moz-range-track {
					height: 4px;
					border-radius: 999px;
					background: linear-gradient(90deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.06));
					border: 1px solid rgba(255, 255, 255, 0.16);
					box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12);
				}
				.dsbce-slider input[type="range"]::-moz-range-thumb {
					width: 16px;
					height: 16px;
					border-radius: 50%;
					border: 1px solid rgba(255, 255, 255, 0.85);
					background:
						radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.4) 38%, rgba(255, 255, 255, 0.12) 100%);
					box-shadow:
						inset 0 1px 2px rgba(255, 255, 255, 0.85),
						inset 0 -2px 4px rgba(255, 255, 255, 0.12),
						0 2px 8px rgba(0, 0, 0, 0.25),
						0 0 0 3px rgba(255, 255, 255, 0.12);
					transition: transform 0.15s ease, box-shadow 0.15s ease;
				}
				.dsbce-slider input[type="range"]::-moz-range-thumb:hover {
					transform: scale(1.12);
					box-shadow:
						inset 0 1px 3px rgba(255, 255, 255, 0.95),
						inset 0 -2px 5px rgba(255, 255, 255, 0.15),
						0 3px 12px rgba(0, 0, 0, 0.3),
						0 0 0 4px rgba(255, 255, 255, 0.16);
				}
				.dsbce-slider input[type="range"]:disabled {
					opacity: 0.5;
					cursor: default;
				}
				.dsbce-settings-reset {
					align-self: flex-start;
					padding: 4px 10px;
					border-radius: 8px;
					border: 1px solid rgba(255, 255, 255, 0.35);
					background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.08));
					-webkit-backdrop-filter: blur(6px);
					backdrop-filter: blur(6px);
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 1px 4px rgba(0, 0, 0, 0.08);
					color: var(--dsw-alias-label-primary, #1f2328);
					cursor: pointer;
					font-size: 11px;
					transition: background 0.2s ease, box-shadow 0.2s ease;
				}
				.dsbce-settings-reset:hover {
					background: linear-gradient(135deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.14));
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 2px 6px rgba(0, 0, 0, 0.1);
				}
				.dsbce-disabled {
					opacity: 0.5;
				}
				.dsbce-check {
					display: flex;
					align-items: center;
					gap: 6px;
					font-size: 11px;
					line-height: 16px;
					cursor: pointer;
				}
				.dsbce-check input[type="checkbox"] {
					width: auto;
					height: auto;
					margin: 0;
					accent-color: #4f8cff;
				}
				.dsbce-color-row {
					display: flex;
					align-items: center;
					gap: 8px;
					font-size: 11px;
					line-height: 16px;
					color: var(--dsw-alias-label-secondary, #57606a);
				}
				.dsbce-color-row input[type="color"] {
					width: 34px;
					height: 22px;
					padding: 0;
					border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
					border-radius: 6px;
					background: transparent;
					cursor: pointer;
				}
				.dsbce-color-row input[type="color"]:disabled {
					opacity: 0.4;
					cursor: default;
				}
				.dsbce-stats {
					margin-top: 8px;
					padding-top: 8px;
					border-top: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.06));
					display: flex;
					flex-direction: column;
					gap: 4px;
				}
				.dsbce-range-tabs {
					display: flex;
					flex-wrap: wrap;
					gap: 4px;
					margin-bottom: 2px;
				}
				.dsbce-range-tabs button {
					border: 1px solid rgba(255, 255, 255, 0.3);
					border-radius: 999px;
					padding: 1px 8px;
					font-size: 10px;
					line-height: 16px;
					cursor: pointer;
					color: var(--dsw-alias-label-secondary, #57606a);
					background: linear-gradient(135deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.06));
					-webkit-backdrop-filter: blur(6px);
					backdrop-filter: blur(6px);
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 1px 3px rgba(0, 0, 0, 0.06);
					transition: background 0.2s ease, box-shadow 0.2s ease;
				}
				.dsbce-range-tabs button:hover {
					background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.12));
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 1px 4px rgba(0, 0, 0, 0.08);
				}
				.dsbce-range-tabs button.active {
					color: #fff;
					background: linear-gradient(135deg, rgba(79, 140, 255, 0.85), rgba(79, 140, 255, 0.5));
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 2px 6px rgba(79, 140, 255, 0.25);
				}
				.dsbce-stats-row {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 8px;
					font-size: 11px;
					line-height: 16px;
					color: var(--dsw-alias-label-secondary, #57606a);
				}
				.dsbce-stats-value {
					color: var(--dsw-alias-label-primary, #1f2328);
					font-weight: 600;
					font-variant-numeric: tabular-nums;
					white-space: nowrap;
				}
				.dsbce-oneline {
					display: flex;
					align-items: center;
					gap: 4px;
					font-size: 10px;
					line-height: 14px;
					color: var(--dsw-alias-label-tertiary, #8b949e);
					font-variant-numeric: tabular-nums;
				}
				.dsbce-stats-loading {
					font-size: 10px;
					line-height: 14px;
					color: var(--dsw-alias-label-tertiary, #8b949e);
				}
				.dsbce-models {
					display: flex;
					flex-direction: column;
					gap: 3px;
					margin-top: 4px;
					padding-top: 6px;
					border-top: 1px dashed var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.06));
				}
				.dsbce-model-row {
					display: flex;
					align-items: baseline;
					justify-content: space-between;
					gap: 8px;
					font-size: 10px;
					line-height: 14px;
				}
				.dsbce-model-name {
					flex: 1;
					min-width: 0;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					color: var(--dsw-alias-label-secondary, #57606a);
				}
				.dsbce-model-nums {
					flex: none;
					color: var(--dsw-alias-label-primary, #1f2328);
					font-weight: 600;
					font-variant-numeric: tabular-nums;
					white-space: nowrap;
				}
				.dsbce-model-cost {
					flex: none;
					color: var(--dsw-alias-label-secondary, #57606a);
					font-variant-numeric: tabular-nums;
					white-space: nowrap;
					min-width: 52px;
					text-align: right;
				}
				.dsbce-stats-hint {
					font-size: 10px;
					line-height: 14px;
					color: var(--dsw-alias-label-tertiary, #8b949e);
					word-break: break-word;
				}
				.dsbce-chart {
					margin-top: 6px;
					padding-top: 6px;
					border-top: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.06));
					display: flex;
					flex-direction: column;
					gap: 4px;
				}
				.dsbce-chart-tabs {
					display: flex;
					gap: 4px;
				}
				.dsbce-chart-tabs button {
					border: 1px solid rgba(255, 255, 255, 0.3);
					border-radius: 999px;
					padding: 1px 8px;
					font-size: 10px;
					line-height: 16px;
					cursor: pointer;
					color: var(--dsw-alias-label-secondary, #57606a);
					background: linear-gradient(135deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.06));
					-webkit-backdrop-filter: blur(6px);
					backdrop-filter: blur(6px);
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 1px 3px rgba(0, 0, 0, 0.06);
					transition: background 0.2s ease, box-shadow 0.2s ease;
				}
				.dsbce-chart-tabs button.active {
					color: #fff;
					background: linear-gradient(135deg, rgba(79, 140, 255, 0.85), rgba(79, 140, 255, 0.5));
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 2px 6px rgba(79, 140, 255, 0.25);
				}
				.dsbce-chart-bars {
					display: flex;
					align-items: flex-end;
					gap: 3px;
					height: 84px;
					padding: 6px 4px 0;
					border-radius: 12px;
					border: 1px solid rgba(255, 255, 255, 0.2);
					background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.05));
					-webkit-backdrop-filter: blur(8px);
					backdrop-filter: blur(8px);
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.06);
				}
				.dsbce-chart-col {
					position: relative;
					flex: 1;
					min-width: 0;
					height: 100%;
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 2px;
				}
				.dsbce-chart-tip {
					position: absolute;
					bottom: calc(100% + 6px);
					left: 50%;
					transform: translateX(-50%) scale(0.9);
					transform-origin: bottom center;
					opacity: 0;
					pointer-events: none;
					white-space: nowrap;
					z-index: 6;
					padding: 4px 8px;
					border-radius: 8px;
					border: 1px solid rgba(255, 255, 255, 0.35);
					background: color-mix(in srgb, var(--dsw-alias-bg-overlay, #ffffff) 78%, transparent);
					-webkit-backdrop-filter: blur(10px);
					backdrop-filter: blur(10px);
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 4px 12px rgba(0, 0, 0, 0.18);
					font-size: 10px;
					line-height: 14px;
					color: var(--dsw-alias-label-primary, #1f2328);
					transition: opacity 0.15s ease, transform 0.15s ease;
				}
				.dsbce-chart-col:hover .dsbce-chart-tip {
					opacity: 1;
					transform: translateX(-50%) scale(1);
				}
				.dsbce-chart-bar-wrap {
					flex: 1;
					width: 100%;
					display: flex;
					align-items: flex-end;
					justify-content: center;
				}
				.dsbce-chart-bar {
					width: 65%;
					min-height: 2px;
					border-radius: 4px 4px 2px 2px;
					background: linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(79, 140, 255, 0.6));
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 1px 3px rgba(0, 0, 0, 0.15);
					transition: height 0.2s ease;
				}
				.dsbce-chart-day {
					font-size: 8px;
					line-height: 10px;
					color: var(--dsw-alias-label-tertiary, #8b949e);
					white-space: nowrap;
				}
				.dsbce-chart-day-30 {
					font-size: 7px;
					line-height: 9px;
				}
				.dsbce-footer {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 8px;
					margin-top: 8px;
				}
				.dsbce-recharge {
					display: inline-flex;
					align-items: center;
					gap: 4px;
					font-size: 11px;
					font-weight: 600;
					color: var(--dsw-alias-label-link, #0969da);
					text-decoration: none;
					padding: 2px 8px;
					border-radius: 8px;
				}
				.dsbce-recharge:hover {
					background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));
					text-decoration: underline;
				}
				/* ---- 主题切换按钮与主题面板 ---- */
				.dsbce-icon-btn.active {
					color: var(--dsbce-accent, #4f8cff);
					background: var(--dsbce-accent-soft, rgba(79, 140, 255, 0.16));
				}
				.dsbce-themes {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 6px;
					margin-top: 8px;
					padding: 8px;
					border-radius: 12px;
					background: color-mix(in srgb, var(--dsw-alias-bg-overlay, #ffffff) 62%, transparent);
					border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.06));
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-themes {
					background: var(--dsbce-solid-panel, rgba(0, 0, 0, 0.05));
					border-color: var(--dsbce-solid-border, rgba(0, 0, 0, 0.10));
				}
				.dsbce-themes-head {
					grid-column: 1 / -1;
					display: flex;
					align-items: baseline;
					justify-content: space-between;
					gap: 8px;
					padding: 0 2px;
					font-size: 11px;
					line-height: 16px;
					font-weight: 600;
				}
				.dsbce-themes-hint {
					font-size: 10px;
					line-height: 14px;
					font-weight: 400;
					color: var(--dsw-alias-label-tertiary, #8b949e);
				}
				.dsbce-themes-group {
					grid-column: 1 / -1;
					padding: 2px 2px 0;
					font-size: 10px;
					line-height: 14px;
					color: var(--dsw-alias-label-tertiary, #8b949e);
					letter-spacing: 0.04em;
				}
				.dsbce-theme-item {
					display: flex;
					align-items: center;
					gap: 6px;
					min-width: 0;
					padding: 4px 6px;
					border-radius: 9px;
					border: 1px solid transparent;
					background: transparent;
					color: var(--dsw-alias-label-secondary, #57606a);
					font-size: 10px;
					line-height: 14px;
					text-align: left;
					cursor: pointer;
					transition: background 0.15s ease, border-color 0.15s ease;
				}
				.dsbce-theme-item:hover {
					background: var(--dsbce-solid-hover, var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06)));
				}
				.dsbce-theme-item[aria-pressed="true"] {
					border-color: color-mix(in srgb, var(--dsbce-accent, #4f8cff) 50%, transparent);
					background: var(--dsbce-accent-soft, rgba(79, 140, 255, 0.16));
					color: var(--dsw-alias-label-primary, #1f2328);
				}
				.dsbce-theme-dot {
					flex: none;
					width: 16px;
					height: 16px;
					border-radius: 5px;
					border: 1px solid rgba(127, 127, 127, 0.35);
					box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
				}
				.dsbce-theme-name {
					flex: 1;
					min-width: 0;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				/* ---- 实色主题：不再使用液态玻璃层 ---- */
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-card-content {
					background: var(--dsbce-solid-bg, #ffffff);
					-webkit-backdrop-filter: none;
					backdrop-filter: none;
					border-color: var(--dsbce-solid-border, rgba(0, 0, 0, 0.10));
					box-shadow: var(--dsbce-solid-shadow, 0 12px 30px rgba(0, 0, 0, 0.14));
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-card-content::before {
					background: radial-gradient(120% 85% at 50% -25%, var(--dsbce-solid-glow, transparent) 0%, transparent 68%);
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-card-content::after {
					display: none;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-3d-layer {
					display: none;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-icon-btn:hover {
					background: var(--dsbce-solid-hover, rgba(0, 0, 0, 0.06));
					-webkit-backdrop-filter: none;
					backdrop-filter: none;
					box-shadow: none;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-settings {
					background: var(--dsbce-solid-panel, rgba(0, 0, 0, 0.05));
					border-color: var(--dsbce-solid-border, rgba(0, 0, 0, 0.10));
					scrollbar-color: var(--dsbce-slider-track, rgba(0, 0, 0, 0.14)) transparent;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-settings::-webkit-scrollbar-thumb {
					background: var(--dsbce-slider-track, rgba(0, 0, 0, 0.14));
					border-color: transparent;
					box-shadow: none;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-settings input:not([type="range"]) {
					background: var(--dsbce-solid-panel, rgba(0, 0, 0, 0.05));
					border-color: var(--dsbce-solid-border, rgba(0, 0, 0, 0.10));
					-webkit-backdrop-filter: none;
					backdrop-filter: none;
					box-shadow: none;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-settings-actions button,
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-settings-reset {
					background: transparent;
					border-color: var(--dsbce-solid-border, rgba(0, 0, 0, 0.14));
					-webkit-backdrop-filter: none;
					backdrop-filter: none;
					box-shadow: none;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-settings-actions button:hover:not(:disabled),
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-settings-reset:hover {
					background: var(--dsbce-solid-hover, rgba(0, 0, 0, 0.06));
					box-shadow: none;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-range-tabs button,
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-chart-tabs button {
					background: transparent;
					border-color: var(--dsbce-solid-border, rgba(0, 0, 0, 0.14));
					-webkit-backdrop-filter: none;
					backdrop-filter: none;
					box-shadow: none;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-range-tabs button:hover,
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-chart-tabs button:hover {
					background: var(--dsbce-solid-hover, rgba(0, 0, 0, 0.06));
					box-shadow: none;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-range-tabs button.active,
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-chart-tabs button.active {
					color: var(--dsbce-accent-contrast, #ffffff);
					background: var(--dsbce-accent, #4f8cff);
					box-shadow: none;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-chart-bars {
					background: var(--dsbce-solid-panel, rgba(0, 0, 0, 0.05));
					border-color: var(--dsbce-solid-border, rgba(0, 0, 0, 0.10));
					-webkit-backdrop-filter: none;
					backdrop-filter: none;
					box-shadow: none;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-chart-tip {
					background: var(--dsbce-solid-bg, #ffffff);
					border-color: var(--dsbce-solid-border, rgba(0, 0, 0, 0.12));
					-webkit-backdrop-filter: none;
					backdrop-filter: none;
					box-shadow: var(--dsbce-solid-shadow, 0 8px 20px rgba(0, 0, 0, 0.16));
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-chart-bar {
					background: linear-gradient(
						180deg,
						color-mix(in srgb, var(--dsbce-accent, #4f8cff) 55%, var(--dsbce-bar-base, #ffffff)),
						var(--dsbce-accent, #4f8cff)
					);
					box-shadow: none;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-recharge:hover {
					background: var(--dsbce-solid-hover, rgba(0, 0, 0, 0.06));
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-slider input[type="range"]::-webkit-slider-runnable-track {
					background: var(--dsbce-slider-track, rgba(0, 0, 0, 0.12));
					border-color: transparent;
					box-shadow: none;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-slider input[type="range"]::-webkit-slider-thumb {
					border-color: var(--dsbce-accent, #4f8cff);
					background: var(--dsbce-accent, #4f8cff);
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.28);
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-slider input[type="range"]::-moz-range-track {
					background: var(--dsbce-slider-track, rgba(0, 0, 0, 0.12));
					border-color: transparent;
					box-shadow: none;
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-slider input[type="range"]::-moz-range-thumb {
					border-color: var(--dsbce-accent, #4f8cff);
					background: var(--dsbce-accent, #4f8cff);
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.28);
				}
				.dsbce-card[data-dsbce-mode="solid"] .dsbce-check input[type="checkbox"] {
					accent-color: var(--dsbce-accent, #4f8cff);
				}
			`;
			document.head.appendChild(style);
			return style;
		}

		// ---- the widget -------------------------------------------------
		function DeepSeekBalanceCard() {
			const [data, setData] = useState(null);
			const [phase, setPhase] = useState("loading"); // loading | ready | error
			const [message, setMessage] = useState("");
			const [updatedAt, setUpdatedAt] = useState(null);
			const [spinning, setSpinning] = useState(false);
			const [settingsOpen, setSettingsOpen] = useState(false);
			const [themeOpen, setThemeOpen] = useState(false);
			const [theme, setTheme] = useState(loadTheme);
			const [settingsInfo, setSettingsInfo] = useState(null);
			const [apiKey, setApiKey] = useState("");
			const [platformToken, setPlatformToken] = useState("");
			const [saving, setSaving] = useState(false);
			const [settingsMessage, setSettingsMessage] = useState(null); // { type, text }
			const [pos, setPos] = useState(loadPosition);
			const [glass, setGlass] = useState(loadGlass);
			const [stats, setStats] = useState(null);
			const [statsRange, setStatsRange] = useState("today");
			const [statsLoading, setStatsLoading] = useState(false);
			const [statsError, setStatsError] = useState(null);
			const [chartMetric, setChartMetric] = useState("cost"); // cost | tokens
			const posRef = useRef(pos);
			const drag = useRef(null);
			const cardRef = useRef(null);
			const settingsRef = useRef(null);
			const settingsScrollTop = useRef(0);
			const settingsScrollPending = useRef(false);

			useEffect(() => {
				posRef.current = pos;
			}, [pos]);

			useEffect(() => {
				try {
					localStorage.setItem(GLASS_KEY, JSON.stringify(glass));
				} catch {}
			}, [glass]);

			useEffect(() => {
				try {
					localStorage.setItem(THEME_KEY, theme);
				} catch {}
			}, [theme]);

			useLayoutEffect(() => {
				if (settingsScrollPending.current && settingsRef.current) {
					settingsRef.current.scrollTop = settingsScrollTop.current;
					settingsScrollPending.current = false;
				}
			}, [glass]);

			const load = useCallback(async () => {
				setSpinning(true);
				try {
					const res = await fetch(BALANCE_PATH, { cache: "no-store" });
					const body = await res.json().catch(() => null);
					if (!res.ok) {
						const error = new Error(
							body && typeof body.message === "string" ? body.message : `请求失败（HTTP ${res.status}）`
						);
						error.code = body && typeof body.error === "string" ? body.error : `http-${res.status}`;
						throw error;
					}
					if (!body || body.ok !== true) {
						throw new Error("余额接口返回了无法识别的数据");
					}
					setData(body);
					setPhase("ready");
					setMessage("");
					setUpdatedAt(new Date());
				} catch (error) {
					setPhase("error");
					setMessage(error instanceof Error ? error.message : String(error));
				} finally {
					setSpinning(false);
				}
			}, []);

			useEffect(() => {
				load();
				const timer = setInterval(load, POLL_MS);
				return () => clearInterval(timer);
			}, [load]);

			const loadStats = useCallback(async (range) => {
				const key = range || "today";
				setStatsLoading(true);
				try {
					const res = await fetch(`${STATS_PATH}?range=${encodeURIComponent(key)}`, { cache: "no-store" });
					const body = await res.json().catch(() => null);
					if (body && body.ok === true) {
						setStats(body);
						setStatsError(null);
					} else {
						setStats(null);
						setStatsError(body && typeof body.message === "string" ? body.message : `统计请求失败（HTTP ${res.status}）`);
					}
				} catch (error) {
					setStats(null);
					setStatsError(error instanceof Error ? error.message : String(error));
				}
				finally {
					setStatsLoading(false);
				}
			}, []);

			useEffect(() => {
				loadStats(statsRange);
			}, [statsRange, loadStats]);

			const refreshSettings = useCallback(async () => {
				try {
					const res = await fetch(SETTINGS_PATH, { cache: "no-store" });
					const body = await res.json();
					if (body && body.ok === true) setSettingsInfo(body);
				} catch {}
			}, []);

			const openSettings = useCallback(() => {
				setSettingsOpen(true);
				setThemeOpen(false);
				setSettingsMessage(null);
				setApiKey("");
				setPlatformToken("");
				refreshSettings();
			}, [refreshSettings]);

			const toggleSettings = useCallback(() => {
				if (settingsOpen) setSettingsOpen(false);
				else openSettings();
			}, [settingsOpen, openSettings]);

			const toggleThemes = useCallback(() => {
				setSettingsOpen(false);
				setThemeOpen((open) => !open);
			}, []);

			const saveKey = useCallback(async () => {
				const key = apiKey.trim();
				if (!key) return;
				setSaving(true);
				setSettingsMessage(null);
				try {
					const res = await fetch(SETTINGS_PATH, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ apiKey: key })
					});
					const body = await res.json().catch(() => null);
					if (!res.ok || !body || body.ok !== true) {
						throw new Error(body && typeof body.message === "string" ? body.message : "保存失败");
					}
					setSettingsMessage({ type: "ok", text: "已保存手动 Key" });
					setApiKey("");
					await refreshSettings();
					load();
				} catch (error) {
					setSettingsMessage({ type: "error", text: error instanceof Error ? error.message : String(error) });
				} finally {
					setSaving(false);
				}
			}, [apiKey, load, refreshSettings]);

			const clearKey = useCallback(async () => {
				setSaving(true);
				setSettingsMessage(null);
				try {
					const res = await fetch(SETTINGS_PATH, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ clear: true })
					});
					const body = await res.json().catch(() => null);
					if (!res.ok || !body || body.ok !== true) {
						throw new Error(body && typeof body.message === "string" ? body.message : "清除失败");
					}
					setSettingsMessage({ type: "ok", text: "已清除手动 Key" });
					setApiKey("");
					await refreshSettings();
					load();
				} catch (error) {
					setSettingsMessage({ type: "error", text: error instanceof Error ? error.message : String(error) });
				} finally {
					setSaving(false);
				}
			}, [load, refreshSettings]);

			// 开放平台登录态：存取 platform.deepseek.com 的 userToken，用于直读官网用量。
			const savePlatformToken = useCallback(async () => {
				const token = platformToken.trim();
				if (!token) return;
				setSaving(true);
				setSettingsMessage(null);
				try {
					const res = await fetch(SETTINGS_PATH, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ platformToken: token })
					});
					const body = await res.json().catch(() => null);
					if (!res.ok || !body || body.ok !== true) {
						throw new Error(body && typeof body.message === "string" ? body.message : "保存失败");
					}
					setSettingsMessage({ type: "ok", text: "已保存开放平台token，正在读取官网数据" });
					setPlatformToken("");
					await refreshSettings();
					load();
					loadStats(statsRange);
				} catch (error) {
					setSettingsMessage({ type: "error", text: error instanceof Error ? error.message : String(error) });
				} finally {
					setSaving(false);
				}
			}, [platformToken, load, loadStats, statsRange, refreshSettings]);

			const clearPlatformToken = useCallback(async () => {
				setSaving(true);
				setSettingsMessage(null);
				try {
					const res = await fetch(SETTINGS_PATH, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ platformToken: "" })
					});
					const body = await res.json().catch(() => null);
					if (!res.ok || !body || body.ok !== true) {
						throw new Error(body && typeof body.message === "string" ? body.message : "清除失败");
					}
					setSettingsMessage({ type: "ok", text: "已清除开放平台token，将不再显示用量" });
					setPlatformToken("");
					await refreshSettings();
					load();
					loadStats(statsRange);
				} catch (error) {
					setSettingsMessage({ type: "error", text: error instanceof Error ? error.message : String(error) });
				} finally {
					setSaving(false);
				}
			}, [load, loadStats, statsRange, refreshSettings]);

			const updateGlass = useCallback((key, value) => {
				if (settingsRef.current) {
					settingsScrollTop.current = settingsRef.current.scrollTop;
					settingsScrollPending.current = true;
				}
				setGlass((prev) => ({ ...prev, [key]: value }));
			}, []);

			const resetGlass = useCallback(() => {
				setGlass({ ...DEFAULT_GLASS });
			}, []);

			// ---- drag ---------------------------------------------------
			const handlePointerDown = (e) => {
				if (e.button !== 0) return;
				const rect = cardRef.current.getBoundingClientRect();
				drag.current = {
					pointerId: e.pointerId,
					startX: e.clientX,
					startY: e.clientY,
					left: rect.left,
					top: rect.top
				};
				e.currentTarget.setPointerCapture(e.pointerId);
			};

			const handlePointerMove = (e) => {
				const d = drag.current;
				if (!d || e.pointerId !== d.pointerId) return;
				const width = cardRef.current ? cardRef.current.offsetWidth : CARD_WIDTH;
				const height = cardRef.current ? cardRef.current.offsetHeight : CARD_HEIGHT;
				const x = clamp(d.left + e.clientX - d.startX, 0, Math.max(0, window.innerWidth - width));
				const y = clamp(d.top + e.clientY - d.startY, 0, Math.max(0, window.innerHeight - height));
				d.currentX = x;
				d.currentY = y;
				setPos({ x, y });
			};

			const handlePointerUp = (e) => {
				const d = drag.current;
				if (d && e.pointerId === d.pointerId) {
					const p =
						typeof d.currentX === "number" && typeof d.currentY === "number"
							? { x: d.currentX, y: d.currentY }
							: posRef.current;
					if (p) {
						try {
							localStorage.setItem(POSITION_KEY, JSON.stringify(p));
						} catch {}
					}
				}
				drag.current = null;
			};

			const payload = data && data.balance ? data.balance : null;
			const balance = payload && Array.isArray(payload.balance_infos) ? payload.balance_infos[0] : null;
			const available = payload ? payload.is_available !== false : null;
			const currency = balance && balance.currency ? balance.currency : "CNY";
			const sourceLabel = data && data.source === "platform" ? "官网" : data && data.source === "harness" ? "DSH Key" : data && data.source === "manual" ? "手动 Key" : "";
			const officialTotalCost = payload && Array.isArray(payload.total_costs) ? payload.total_costs[0] : null;
			const modelRows = stats && Array.isArray(stats.models) ? stats.models : [];
			const dailyData = stats && Array.isArray(stats.daily) ? stats.daily : [];
			const dailyValues = dailyData.map((d) => chartMetric === "cost" ? (d.cost || 0) : (d.totalTokens || 0));
			const dailyMax = Math.max(1, ...dailyValues);

			const stateColor =
				phase === "error"
					? "var(--dsw-alias-state-error-primary, #cf222e)"
					: available === false
						? "var(--dsw-alias-state-error-primary, #cf222e)"
						: "var(--dsw-alias-state-success-primary, #1a7f37)";

			let chip = null;
			if (phase === "ready") {
				chip = jsx("span", {
					className: "dsbce-chip",
					style: { color: stateColor, background: "var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.06))" },
					children: available === false ? "不可用" : "可用"
				});
			} else if (phase === "error") {
				chip = jsx("span", {
					className: "dsbce-chip",
					style: { color: stateColor },
					children: "错误"
				});
			}

			const refreshIcon = jsx("svg", {
				width: 14,
				height: 14,
				viewBox: "0 0 16 16",
				fill: "none",
				style: spinning ? { animation: "dsbce-spin 0.8s linear infinite" } : void 0,
				children: jsx("path", {
					d: "M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 1.5v3h-3",
					stroke: "currentColor",
					strokeWidth: 1.5,
					strokeLinecap: "round",
					strokeLinejoin: "round"
				})
			});

			const gearIcon = jsx("svg", {
				width: 14,
				height: 14,
				viewBox: "0 0 16 16",
				fill: "none",
				children: jsxs(Fragment, {
					children: [
						jsx("circle", { cx: 8, cy: 8, r: 2.2, stroke: "currentColor", strokeWidth: 1.4 }),
						jsx("path", {
							d: "M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.6 3.6l1.4 1.4M11 11l1.4 1.4M12.4 3.6L11 5M5 11l-1.4 1.4",
							stroke: "currentColor",
							strokeWidth: 1.3,
							strokeLinecap: "round"
						})
					]
				})
			});

			// 主题按钮：半明半暗的圆，一眼看出是「切亮/暗」
			const themeIcon = jsx("svg", {
				width: 14,
				height: 14,
				viewBox: "0 0 16 16",
				fill: "none",
				children: jsxs(Fragment, {
					children: [
						jsx("circle", { cx: 8, cy: 8, r: 6, stroke: "currentColor", strokeWidth: 1.3 }),
						jsx("path", { d: "M8 2.2a5.8 5.8 0 0 1 0 11.6z", fill: "currentColor" })
					]
				})
			});

			const effectiveAlpha = glass.colorEnabled ? Math.round(glass.alpha * glass.colorStrength / 100) : glass.alpha;
			const effectiveAlpha2 = Math.max(0, Math.round(effectiveAlpha / 2));
			const layerAlpha = glass.colorEnabled ? Math.max(0, Math.round(glass.colorStrength * 0.3)) : 28;
			const layerAlpha2 = Math.max(0, Math.round(layerAlpha / 2));
			const glassStyle = {
				"--dsbce-alpha": `${effectiveAlpha}%`,
				"--dsbce-alpha2": `${effectiveAlpha2}%`,
				"--dsbce-blur": `${glass.blur}px`,
				"--dsbce-saturate": `${glass.saturate}%`,
				"--dsbce-highlight": String(glass.highlight),
				"--dsbce-highlight-weak": String(Math.max(0, glass.highlight * 0.2)),
				"--dsbce-shine": String(glass.shine),
				"--dsbce-tint": glass.colorEnabled ? glass.color : "var(--dsw-alias-bg-overlay, #ffffff)",
				"--dsbce-layer-alpha": `${layerAlpha}%`,
				"--dsbce-layer-alpha2": `${layerAlpha2}%`,
				"--dsbce-thickness": `${glass.enable3d ? glass.thickness : 0}px`,
				"--dsbce-angle": `${glass.enable3d ? glass.angle : 0}deg`,
				"--dsbce-min-height": `${glass.cardHeight}px`
			};
			const activeTheme = THEMES.find((t) => t.id === theme) || THEMES[0];
			const themeVars = activeTheme.mode === "solid" ? activeTheme.vars : {};
			const cardStyle = {
				...glassStyle,
				...themeVars,
				width: `${glass.cardWidth}px`,
				...(glass.enable3d
					? {
						transform: `perspective(900px) rotateY(${glass.angle}deg)`,
						transformStyle: "preserve-3d"
					}
					: {}),
				...(pos ? { left: pos.x, top: pos.y } : { top: 16, right: 16 })
			};

			const layerStep = 4;
			const layerCount = glass.enable3d && glass.thickness > 0 ? Math.max(1, Math.ceil(glass.thickness / layerStep)) : 0;
			const layers = Array.from({ length: layerCount }, (_, i) =>
				jsx("div", {
					key: i,
					className: "dsbce-3d-layer",
					style: { transform: `translateZ(${-Math.round((i + 1) * layerStep)}px)` }
				})
			);

			return jsx("div", {
				className: "dsbce-card",
				ref: cardRef,
				role: "status",
				"aria-live": "polite",
				"data-plugin": "dsh-liquid-glass-balance-card-enhanced",
				"data-dsbce-mode": activeTheme.mode,
				"data-dsbce-skin": activeTheme.id,
				style: cardStyle,
				children: jsxs(Fragment, {
					children: [
						...layers,
						jsx("div", {
							className: "dsbce-card-content",
							children: jsxs(Fragment, {
								children: [
									jsxs("div", {
										className: "dsbce-header",
							children: [
								jsx("div", {
									className: "dsbce-drag",
									title: "拖动卡片",
									"aria-label": "拖动卡片",
									onPointerDown: handlePointerDown,
									onPointerMove: handlePointerMove,
									onPointerUp: handlePointerUp,
									onPointerCancel: handlePointerUp,
									children: "⠿"
								}),
								jsx("span", { className: "dsbce-title", children: "DeepSeek 余额" }),
								jsx("button", {
									type: "button",
									className: "dsbce-icon-btn",
									"aria-label": "刷新余额与统计",
									title: "刷新",
									disabled: spinning,
									onClick: () => { load(); loadStats(statsRange); },
									children: refreshIcon
								}),
								jsx("button", {
									type: "button",
									className: "dsbce-icon-btn" + (themeOpen ? " active" : ""),
									"aria-label": "切换卡片主题",
									"aria-expanded": themeOpen,
									title: `切换主题（当前：${activeTheme.name}）`,
									onClick: toggleThemes,
									children: themeIcon
								}),
								jsx("button", {
									type: "button",
									className: "dsbce-icon-btn" + (settingsOpen ? " active" : ""),
									"aria-label": "卡片设置",
									title: "卡片设置",
									onClick: toggleSettings,
									children: gearIcon
								})
							]
						}),
						themeOpen
							? jsxs("div", {
								className: "dsbce-themes",
								children: [
									jsxs("div", {
										className: "dsbce-themes-head",
										children: [
											jsx("span", { children: "卡片主题" }),
											jsx("span", { className: "dsbce-themes-hint", children: "点击即时切换" })
										]
									}),
									THEME_GROUPS.map((group) =>
										jsxs(Fragment, {
											key: group,
											children: [
												jsx("div", { className: "dsbce-themes-group", children: group }),
												...THEMES.filter((t) => t.group === group).map((t) =>
													jsxs("button", {
														type: "button",
														className: "dsbce-theme-item",
														"aria-pressed": theme === t.id,
														title: t.name,
														onClick: () => setTheme(t.id),
														children: [
															jsx("span", { className: "dsbce-theme-dot", style: { background: t.dot } }),
															jsx("span", { className: "dsbce-theme-name", children: t.name })
														]
													}, t.id)
												)
											]
										}, group)
									)
								]
							})
							: null,
						phase === "loading"
							? jsx("div", { className: "dsbce-loading", children: "加载中…" })
							: phase === "error"
								? jsx("div", { className: "dsbce-error", title: message, children: message })
								: jsxs(Fragment, {
									children: [
										jsxs("div", {
											className: "dsbce-balance-row",
											children: [
												jsx("span", {
													className: "dsbce-balance-value",
													children: balance ? formatBalance(balance.total_balance, currency) : "—"
												}),
												chip
											]
										}),
										jsxs("div", {
											className: "dsbce-meta",
											children: [
												jsx("span", { children: `赠送 ${balance ? formatBalance(balance.granted_balance, currency) : "—"}` }),
												jsx("span", { children: "·" }),
												jsx("span", { children: `充值 ${balance ? formatBalance(balance.topped_up_balance, currency) : "—"}` }),
												sourceLabel ? jsx("span", { children: `· ${sourceLabel}` }) : null
											]
										}),
										jsxs("div", {
											className: "dsbce-stats",
											children: [
												jsxs("div", {
													className: "dsbce-range-tabs",
													children: Object.keys(RANGE_LABELS).map((key) =>
														jsx("button", {
															type: "button",
															key,
															className: statsRange === key ? "active" : "",
															onClick: () => setStatsRange(key),
															children: RANGE_LABELS[key]
														})
													)
												}),
												officialTotalCost
													? jsxs("div", {
														className: "dsbce-stats-row",
														children: [
															jsx("span", { children: `累计消费（官网·${officialTotalCost.currency}）` }),
															jsx("span", { className: "dsbce-stats-value", children: formatBalance(officialTotalCost.amount, officialTotalCost.currency) })
														]
													})
													: null,
												jsxs("div", {
													className: "dsbce-stats-row",
													children: [
														jsx("span", { children: "累计消费" }),
														jsx("span", { className: "dsbce-stats-value", children: stats ? formatCost(stats.cost, currency) : "—" })
													]
												}),
												jsxs("div", {
													className: "dsbce-stats-row",
													children: [
														jsx("span", { children: "累计 Tokens（官网）" }),
														jsx("span", { className: "dsbce-stats-value", children: stats ? formatTokens(stats.totalTokens) : "—" })
													]
												}),
												stats
													? jsxs("div", {
														className: "dsbce-oneline",
														title: stats.warning || "",
														children: [
															jsx("span", { children: `命中 ${formatTokens(stats.cacheReadTokens)}` }),
															jsx("span", { children: "·" }),
															jsx("span", { children: `未命中 ${formatTokens(stats.inputTokens)}` }),
															jsx("span", { children: "·" }),
															jsx("span", { children: `输出 ${formatTokens(stats.outputTokens)}` })
														]
													})
													: null,
												stats && stats.warning
													? jsx("div", {
														className: "dsbce-stats-hint",
														title: stats.warning,
														children: "官网数据异常（悬停查看详情）"
													})
													: null,
												modelRows.length > 0
													? jsxs("div", {
														className: "dsbce-models",
														children: [
															jsxs("div", {
																className: "dsbce-model-row",
																children: [
																	jsx("span", { className: "dsbce-model-name", children: "模型" }),
																	jsx("span", { className: "dsbce-model-nums", children: "Tokens" }),
																	jsx("span", { className: "dsbce-model-cost", children: "花费" })
																]
															}),
															modelRows.map((m) =>
																jsxs("div", {
																	className: "dsbce-model-row",
																	title: `${m.model} · 请求 ${formatTokens(m.calls)} · 命中 ${formatTokens(m.cacheReadTokens)} / 未命中 ${formatTokens(m.inputTokens)} / 输出 ${formatTokens(m.outputTokens)}`,
																	children: [
																		jsx("span", { className: "dsbce-model-name", children: m.model }),
																		jsx("span", { className: "dsbce-model-nums", children: formatTokens(m.totalTokens) }),
																		jsx("span", { className: "dsbce-model-cost", children: m.costUsd > 0 ? formatCost(m.costUsd, "USD") : formatCost(m.cost, currency) })
																	]
																}, m.model)
															)
														]
													})
													: null,
												statsError
													? jsx("div", { className: "dsbce-stats-hint", children: statsError })
													: null,
												(statsRange === "7d" || statsRange === "30d") && dailyData.length > 0
													? jsxs("div", {
														className: "dsbce-chart",
														children: [
															jsxs("div", {
																className: "dsbce-chart-tabs",
																children: [
																	jsx("button", {
																		type: "button",
																		className: chartMetric === "cost" ? "active" : "",
																		onClick: () => setChartMetric("cost"),
																		children: "消费金额"
																	}),
																	jsx("button", {
																		type: "button",
																		className: chartMetric === "tokens" ? "active" : "",
																		onClick: () => setChartMetric("tokens"),
																		children: "Tokens"
																	})
																]
															}),
															jsx("div", {
																className: "dsbce-chart-bars",
																children: dailyData.map((d, i) => {
																	const value = chartMetric === "cost" ? (d.cost || 0) : (d.totalTokens || 0);
																	const pct = Math.max(2, Math.round(value / dailyMax * 100));
																	const label = chartMetric === "cost" ? formatCost(d.cost, currency) : formatTokens(d.totalTokens);
																	const dayText = statsRange === "7d" ? d.date.slice(5) : d.date.slice(8);
																	return jsx("div", {
																		key: d.date,
																		className: "dsbce-chart-col",
																		title: `${d.date} · ${label}`,
																		children: [
																			jsx("div", {
																				className: "dsbce-chart-tip",
																				children: `${d.date} · ${label}`
																			}),
																			jsx("div", {
																				className: "dsbce-chart-bar-wrap",
																				children: jsx("div", {
																					className: "dsbce-chart-bar",
																					style: { height: `${pct}%` }
																				})
																			}),
																			jsx("div", {
																				className: "dsbce-chart-day" + (statsRange === "30d" ? " dsbce-chart-day-30" : ""),
																				children: dayText
																			})
																		]
																	});
																})
															})
														]
													})
													: null,
												statsLoading
													? jsx("div", { className: "dsbce-stats-loading", children: "统计中…" })
													: null
											]
										}),
										jsx("div", {
											className: "dsbce-footer",
											children: [
												updatedAt
													? jsx("span", { className: "dsbce-updated", children: `更新于 ${formatTime(updatedAt)}` })
													: null,
												jsx("a", {
													className: "dsbce-recharge",
													href: "https://platform.deepseek.com/top_up",
													target: "_blank",
													rel: "noopener noreferrer",
													children: "充值 ↗"
												})
											]
										})
									]
								}),
						settingsOpen
							? jsxs("div", {
								className: "dsbce-settings",
								ref: settingsRef,
								children: [
									jsx("div", { className: "dsbce-settings-title", children: "DeepSeek API Key 设置" }),
									settingsInfo
										? jsx("div", {
											className: "dsbce-settings-info",
											children: settingsInfo.manualConfigured
												? `当前手动 Key：${settingsInfo.maskedKey || "已设置"}`
												: "当前未设置手动 Key"
										})
										: null,
									settingsInfo && settingsInfo.harnessConfigured
										? jsx("div", {
											className: "dsbce-settings-info",
											children: "未设置手动 Key 时，自动使用 DSH 设置 → 模型 中的 DEEPSEEK_API_KEY。"
										})
										: null,
									jsx("input", {
										type: "password",
										value: apiKey,
										placeholder: "粘贴 DeepSeek API Key",
										onChange: (e) => setApiKey(e.target.value),
										onKeyDown: (e) => {
											if (e.key === "Enter") saveKey();
										}
									}),
									jsxs("div", {
										className: "dsbce-settings-actions",
										children: [
											jsx("button", {
												type: "button",
												disabled: saving || !apiKey.trim(),
												onClick: saveKey,
												children: saving ? "保存中…" : "保存"
											}),
											jsx("button", {
												type: "button",
												disabled: saving,
												onClick: clearKey,
												children: "清除"
											})
										]
									}),
									settingsMessage
										? jsx("div", {
											className: `dsbce-settings-msg dsbce-settings-msg-${settingsMessage.type}`,
											children: settingsMessage.text
										})
										: null,
									jsxs("div", {
										className: "dsbce-section",
										children: [
											jsx("div", { className: "dsbce-settings-title", children: "官网实时用量（platform.deepseek.com）" }),
											settingsInfo
												? jsx("div", {
													className: "dsbce-settings-info",
													children: settingsInfo.platformConfigured
														? `当前登录态：${settingsInfo.maskedPlatformToken || "已设置"}（用量取自官网）`
														: "未设置：设置后用量直读官网（当前不显示用量）"
												})
												: null,
											jsx("div", {
												className: "dsbce-settings-info",
												children: "填登录 token 后，余额、各模型 tokens 与花费全部直读官网（与 /usage 页一致），不做任何本地估算。取法：登录 platform.deepseek.com → F12 → Console → 输入 localStorage.userToken 回车，整段复制（也可只复制其中 value 字段）"
											}),
											jsx("input", {
												type: "password",
												value: platformToken,
												placeholder: "粘贴 userToken（JSON 整段或裸 token 均可）",
												onChange: (e) => setPlatformToken(e.target.value),
												onKeyDown: (e) => {
													if (e.key === "Enter") savePlatformToken();
												}
											}),
											jsxs("div", {
												className: "dsbce-settings-actions",
												children: [
													jsx("button", {
														type: "button",
														disabled: saving || !platformToken.trim(),
														onClick: savePlatformToken,
														children: saving ? "保存中…" : "保存"
													}),
													jsx("button", {
														type: "button",
														disabled: saving,
														onClick: clearPlatformToken,
														children: "清除"
													})
												]
											})
										]
									}),
									jsxs("div", {
										className: "dsbce-section",
										children: [
											jsx("div", { className: "dsbce-settings-title", children: "玻璃效果参数" }),
											activeTheme.mode === "solid"
												? jsx("div", {
													className: "dsbce-settings-info",
													children: `当前是「${activeTheme.name}」实色主题，玻璃参数只在「液态玻璃」主题下生效。`
												})
												: null,
											jsx(GlassSlider, {
												label: "透明度",
												value: glass.alpha,
												min: 0,
												max: 80,
												step: 1,
												unit: "%",
												onChange: (v) => updateGlass("alpha", v)
											}),
											jsx(GlassSlider, {
												label: "背景模糊",
												value: glass.blur,
												min: 0,
												max: 40,
												step: 1,
												unit: "px",
												onChange: (v) => updateGlass("blur", v)
											}),
											jsx(GlassSlider, {
												label: "饱和度",
												value: glass.saturate,
												min: 100,
												max: 300,
												step: 10,
												unit: "%",
												onChange: (v) => updateGlass("saturate", v)
											}),
											jsx(GlassSlider, {
												label: "高光强度",
												value: Math.round(glass.highlight * 100),
												min: 0,
												max: 100,
												step: 5,
												unit: "%",
												onChange: (v) => updateGlass("highlight", v / 100)
											}),
											jsx(GlassSlider, {
												label: "流动光线",
												value: Math.round(glass.shine * 100),
												min: 0,
												max: 50,
												step: 5,
												unit: "%",
												onChange: (v) => updateGlass("shine", v / 100)
											}),
											jsx("button", {
												type: "button",
												className: "dsbce-settings-reset",
												onClick: resetGlass,
												children: "恢复默认"
											})
										]
									}),
									jsxs("div", {
										className: "dsbce-section",
										children: [
											jsx("div", { className: "dsbce-settings-title", children: "3D 立体效果" }),
											jsx("label", {
												className: "dsbce-check",
												children: [
													jsx("input", {
														type: "checkbox",
														checked: glass.enable3d,
														onChange: (e) => updateGlass("enable3d", e.target.checked)
													}),
													jsx("span", { children: "启用 3D 立体厚度" })
												]
											}),
											jsx(GlassSlider, {
												label: "立体厚度",
												value: glass.thickness,
												min: 0,
												max: 40,
												step: 1,
												unit: "px",
												disabled: !glass.enable3d,
												onChange: (v) => updateGlass("thickness", v)
											}),
											jsx(GlassSlider, {
												label: "侧向角度",
												value: glass.angle,
												min: -30,
												max: 30,
												step: 1,
												unit: "°",
												disabled: !glass.enable3d,
												onChange: (v) => updateGlass("angle", v)
											})
										]
									}),
									jsxs("div", {
										className: "dsbce-section",
										children: [
											jsx("div", { className: "dsbce-settings-title", children: "卡片尺寸" }),
											jsx(GlassSlider, {
												label: "卡片宽度",
												value: glass.cardWidth,
												min: 220,
												max: 420,
												step: 4,
												unit: "px",
												onChange: (v) => updateGlass("cardWidth", v)
											}),
											jsx(GlassSlider, {
												label: "最小高度",
												value: glass.cardHeight,
												min: 0,
												max: 400,
												step: 10,
												unit: "px",
												onChange: (v) => updateGlass("cardHeight", v)
											}),
											jsx("div", {
												className: "dsbce-settings-info",
												children: "最小高度为 0 时自动适应内容。"
											})
										]
									}),
									jsxs("div", {
										className: "dsbce-section",
										children: [
											jsx("div", { className: "dsbce-settings-title", children: "颜色调节" }),
											jsx("label", {
												className: "dsbce-check",
												children: [
													jsx("input", {
														type: "checkbox",
														checked: glass.colorEnabled,
														onChange: (e) => updateGlass("colorEnabled", e.target.checked)
													}),
													jsx("span", { children: "自定义玻璃颜色（保持液态玻璃特性）" })
												]
											}),
											jsx("div", {
												className: "dsbce-color-row",
												children: [
													jsx("input", {
														type: "color",
														value: glass.color,
														disabled: !glass.colorEnabled,
														onChange: (e) => updateGlass("color", e.target.value)
													}),
													jsx("span", { children: glass.colorEnabled ? glass.color : "默认主题色" })
												]
											}),
											jsx(GlassSlider, {
												label: "颜色浓度",
												value: glass.colorStrength,
												min: 0,
												max: 100,
												step: 5,
												unit: "%",
												disabled: !glass.colorEnabled,
												onChange: (v) => updateGlass("colorStrength", v)
											})
										]
									})
								]
							})
							: null
								]
							})
						})
					]
				})
			});
		}

		// ---- client plugin body -----------------------------------------
		const inject = ["slots"];

		function apply(ctx) {
			const styleEl = injectStyles();
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "liquid-glass-balance-card-enhanced",
				order: 100,
				label: "DeepSeek 余额卡片"
			}, DeepSeekBalanceCard));
			ctx.effect(() => () => {
				if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
			}, "dsh-liquid-glass-balance-card-enhanced: styles");
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
