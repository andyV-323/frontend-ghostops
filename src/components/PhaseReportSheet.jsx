// ─────────────────────────────────────────────────────────────────────────────
// PhaseReportSheet.jsx
// Post-mission phase debrief questionnaire — 4 screens, all taps.
// Saves a Phase record to the operation. Replaces ReconTool.
//
// Props:
//   mission       — active mission/operation object
//   phaseNumber   — current phase number (auto-incremented by parent)
//   onSave        — (phaseData) => void — called when player submits
//   onClose       — () => void
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faChevronRight,
	faChevronLeft,
	faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { MISSION_TYPES } from "@/api/GhostOpsApi";

// ─── Screen list ──────────────────────────────────────────────────────────────

const SCREENS = ["OUTCOME", "COMPLICATIONS", "CASUALTIES", "INTEL"];

// ─── Casualties (universal) ───────────────────────────────────────────────────

const CASUALTY_OPTIONS = [
	{ id: "none",          label: "No casualties",             color: "text-green-400",  border: "border-green-500/30",  activeBg: "bg-green-500/8" },
	{ id: "injured",       label: "Operator injured (WIA)",    color: "text-yellow-400", border: "border-yellow-500/30", activeBg: "bg-yellow-500/8" },
	{ id: "kia",           label: "Operator KIA",              color: "text-red-400",    border: "border-red-500/30",    activeBg: "bg-red-500/8" },
	{ id: "multiple_wia",  label: "Multiple operators WIA",    color: "text-orange-400", border: "border-orange-500/30", activeBg: "bg-orange-500/8" },
	{ id: "missing",       label: "Operator MIA / unknown fate", color: "text-purple-400", border: "border-purple-500/30", activeBg: "bg-purple-500/8" },
];

// ─── Outcome option sets ──────────────────────────────────────────────────────

const O = (id, label, sub, color, border, activeBg, dot) => ({ id, label, sub, color, border, activeBg, dot });

const OUTCOME_BY_MISSION = {
	// ── Direct Action — Raid / Strike / Sabotage / Elimination ───────────────
	DA_RAID: [
		O("clean",       "Objective complete",       "Clean breach — no compromise",                        "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("compromised", "Objective complete",       "Element compromised during infil or on objective",    "text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("heavy",       "Objective complete",       "Sustained heavy contact — high ammo expenditure",     "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("partial",     "Partial success",          "Secondary target missed or not engaged",              "text-blue-400",   "border-blue-500/40",   "bg-blue-500/10",   "bg-blue-400"),
		O("aborted",     "Objective not achieved",   "Mission aborted — objective not reached",             "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
	],
	DA_AMBUSH: [
		O("clean",       "Effective ambush",         "Kill zone effective — target destroyed",              "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("partial",     "Partial interdiction",     "Some elements escaped the kill zone",                 "text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("heavy",       "Objective complete",       "Kill zone held — sustained return fire",              "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("no_show",     "Target did not appear",    "Convoy rerouted — no contact initiated",              "text-blue-400",   "border-blue-500/40",   "bg-blue-500/10",   "bg-blue-400"),
		O("overrun",     "Position overrun",         "Kill zone breached — element broke contact",          "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
	],
	DA_SNATCH: [
		O("clean",       "HVT secured",              "Exfil successful — HVT in custody",                  "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("hot_exfil",   "HVT secured",              "Exfil under contact — custody maintained",           "text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("hvt_escaped", "HVT escaped",              "Target fled during breach or transit",               "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("hvt_kia",     "HVT killed",               "Target KIA — custody objective failed",              "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
		O("aborted",     "Mission aborted",          "Target not viable — operation called off",           "text-purple-400", "border-purple-500/40", "bg-purple-500/10", "bg-purple-400"),
	],
	DA_ELIMINATION: [
		O("clean",       "HVT neutralized",          "Kill confirmed — clean exfil",                       "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("compromised", "HVT neutralized",          "Kill confirmed — element compromised during exfil",  "text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("heavy",       "HVT neutralized",          "Kill confirmed — sustained heavy contact",           "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("unconfirmed", "Kill unconfirmed",         "Target hit — BDA inconclusive",                      "text-blue-400",   "border-blue-500/40",   "bg-blue-500/10",   "bg-blue-400"),
		O("target_fled", "HVT escaped",              "Target evaded before engagement",                    "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
	],
	DA_SABOTAGE: [
		O("clean",       "Target destroyed",         "Demolition successful — clean exfil",                "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("partial",     "Partial demolition",       "Target damaged — not fully destroyed",               "text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("heavy",       "Target destroyed",         "Demo successful — element took contact on exfil",    "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("charges_lost","Demo failed",              "Charges lost or placed incorrectly",                 "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
		O("aborted",     "Mission aborted",          "Target not accessible — operation called off",       "text-purple-400", "border-purple-500/40", "bg-purple-500/10", "bg-purple-400"),
	],
	DA_STRIKE: [
		O("clean",       "Node destroyed",           "Strike complete — no collateral damage",             "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("partial",     "Node degraded",            "Partial destruction — redundant systems intact",     "text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("heavy",       "Node destroyed",           "Strike complete — sustained contact on exfil",       "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("collateral",  "Node destroyed",           "Strike complete — unintended collateral damage",     "text-blue-400",   "border-blue-500/40",   "bg-blue-500/10",   "bg-blue-400"),
		O("aborted",     "Strike aborted",           "Target location denied — operation called off",      "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
	],
	DA_CONVOY: [
		O("clean",       "Convoy destroyed",         "Interdiction complete — all vehicles neutralized",   "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("partial",     "Partial interdiction",     "Lead elements destroyed — rear elements escaped",    "text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("heavy",       "Convoy destroyed",         "Mission complete — QRF responded during exfil",      "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("no_show",     "Convoy did not appear",    "Target rerouted — no contact initiated",             "text-blue-400",   "border-blue-500/40",   "bg-blue-500/10",   "bg-blue-400"),
		O("aborted",     "Mission aborted",          "Position compromised — operation called off",        "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
	],
	// ── Special Reconnaissance ──────────────────────────────────────────────
	SR_AREA: [
		O("clean",       "Collection complete",      "Full window — no compromise, no contact",            "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("partial",     "Partial collection",       "Window cut short — exfil forced early",              "text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("compromised", "Collection complete",      "Full window — element detected on exfil",            "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("nothing",     "No actionable intel",      "Collection window complete — no new intelligence",   "text-blue-400",   "border-blue-500/40",   "bg-blue-500/10",   "bg-blue-400"),
		O("aborted",     "Mission aborted",          "OP position blown — element exfiled immediately",    "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
	],
	SR_POINT: [
		O("clean",       "OP complete",              "Observation dwell met — no compromise",              "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("extended",    "OP extended",              "Dwell extended — additional intelligence gathered",  "text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("cut_short",   "OP cut short",             "Dwell incomplete — exfil forced before window",      "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("compromised", "OP blown",                 "Position detected — emergency exfil executed",       "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
		O("nothing",     "No actionable intel",      "OP complete — target activity not observed",         "text-blue-400",   "border-blue-500/40",   "bg-blue-500/10",   "bg-blue-400"),
	],
	SR_BDA: [
		O("confirmed",   "Destruction confirmed",    "Target neutralized — BDA complete",                  "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("partial",     "Partial damage confirmed", "Target degraded — not fully destroyed",              "text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("intact",      "Target intact",            "Strike ineffective — target operational",            "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("denied",      "BDA denied",               "Area too hot — assessment incomplete",               "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
		O("secondary",   "Secondary target found",   "BDA revealed additional high-value target",          "text-blue-400",   "border-blue-500/40",   "bg-blue-500/10",   "bg-blue-400"),
	],
	// ── Counterterrorism ────────────────────────────────────────────────────
	CT_HOSTAGE: [
		O("clean",       "All hostages recovered",   "Assault complete — element and hostages intact",     "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("partial",     "Partial recovery",         "Some hostages recovered — others unaccounted for",   "text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("hot_exfil",   "Hostages recovered",       "All recovered — sustained contact during exfil",     "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("hostage_kia", "Hostage KIA",              "One or more hostages killed during operation",       "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
		O("aborted",     "Assault aborted",          "Too high a risk — operation called off",             "text-purple-400", "border-purple-500/40", "bg-purple-500/10", "bg-purple-400"),
	],
	CT_STRIKE: [
		O("clean",       "Target neutralized",       "Strike complete — ROE maintained",                   "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("compromised", "Target neutralized",       "Strike complete — civilian presence encountered",    "text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("heavy",       "Target neutralized",       "Strike complete — sustained enemy contact",          "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("partial",     "Partial success",          "Primary target hit — secondary network intact",      "text-blue-400",   "border-blue-500/40",   "bg-blue-500/10",   "bg-blue-400"),
		O("aborted",     "Strike aborted",           "Positive ID not confirmed — ROE not met",            "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
	],
	CT_RECOVERY: [
		O("clean",       "Personnel recovered",      "Isolated individual recovered — element intact",     "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("under_fire",  "Personnel recovered",      "Recovery successful — sustained contact during exfil","text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("critical",    "Personnel recovered",      "Individual recovered — critical medical status",     "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("personnel_kia","Personnel KIA",           "Isolated individual KIA before recovery",            "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
		O("aborted",     "Recovery aborted",         "Location too compromised — operation called off",    "text-purple-400", "border-purple-500/40", "bg-purple-500/10", "bg-purple-400"),
	],
	// ── Overwatch / Support ────────────────────────────────────────────────
	OW_OVERWATCH: [
		O("clean",       "Overwatch maintained",     "Supported element cleared — no contact on position", "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("engaged",     "Position under fire",      "Overwatch position taken under direct fire",         "text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("displaced",   "Position displaced",       "Element displaced — alternate position occupied",    "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("fires_called","Direct fires called",      "Sniper or support fires engaged threat element",     "text-blue-400",   "border-blue-500/40",   "bg-blue-500/10",   "bg-blue-400"),
		O("aborted",     "Overwatch not established","Position could not be reached — insertion failed",   "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
	],
	OW_RESUPPLY: [
		O("clean",       "Resupply complete",        "All materiel delivered — route clear",               "text-green-400",  "border-green-500/40",  "bg-green-500/10",  "bg-green-400"),
		O("contact",     "Resupply complete",        "Delivery made — route interdicted during transit",   "text-yellow-400", "border-yellow-500/40", "bg-yellow-500/10", "bg-yellow-400"),
		O("partial",     "Partial delivery",         "Some materiel lost — element took losses en route",  "text-orange-400", "border-orange-500/40", "bg-orange-500/10", "bg-orange-400"),
		O("route_denied","Route denied",             "Primary route too hot — alternate not viable",       "text-blue-400",   "border-blue-500/40",   "bg-blue-500/10",   "bg-blue-400"),
		O("aborted",     "Mission aborted",          "Resupply called off — recipient element moved",      "text-red-400",    "border-red-500/40",    "bg-red-500/10",    "bg-red-400"),
	],
};

// ─── Complications by category ────────────────────────────────────────────────

const C = (id, label, exclusive = false) => ({ id, label, exclusive });

const COMPLICATIONS_BY_CATEGORY = {
	"Direct Action": [
		C("none",               "No complications",                         true),
		C("qrf_responded",      "QRF responded",                            false),
		C("breach_compromised", "Breach point compromised — hard entry",    false),
		C("target_relocated",   "Target relocated mid-operation",           false),
		C("exfil_compromised",  "Exfil route compromised",                  false),
		C("air_denied",         "Air support / CAS denied",                 false),
		C("isr_offline",        "ISR or comms went offline",                false),
		C("civilian_contact",   "Unexpected civilian contact",              false),
		C("intel_cache",        "Intel cache recovered (bonus)",            false),
		C("asset_lost",         "Vehicle or asset destroyed / lost",        false),
		C("secondary_charges",  "Secondary explosions drew QRF early",      false),
	],
	"Special Reconnaissance": [
		C("none",              "No complications",                          true),
		C("op_detected",       "OP position detected by patrol",            false),
		C("comms_lost",        "Communications lost during window",         false),
		C("dwell_extended",    "Dwell time extended beyond plan",           false),
		C("patrol_shifted",    "Enemy patrol pattern changed",              false),
		C("weather",           "Weather degraded observation window",       false),
		C("local_contact",     "Civilian discovered OP position",           false),
		C("exfil_delayed",     "Exfil delayed — route obstructed",         false),
		C("target_absent",     "Target did not appear in observation window",false),
		C("sigint_window",     "Comms intercept opportunity missed",        false),
	],
	"Counterterrorism": [
		C("none",              "No complications",                          true),
		C("qrf_responded",     "QRF responded faster than anticipated",     false),
		C("target_relocated",  "Target relocated before assault",           false),
		C("booby_trap",        "Booby trap or IED encountered",             false),
		C("exfil_under_fire",  "Exfil conducted under direct fire",         false),
		C("human_shield",      "Civilian used as human shield",             false),
		C("isr_offline",       "ISR or comms went offline",                 false),
		C("civilian_contact",  "Unexpected civilian presence",              false),
		C("asset_lost",        "Vehicle or asset destroyed / lost",         false),
		C("secondary_network", "Secondary network element identified",      false),
	],
	"Overwatch": [
		C("none",              "No complications",                          true),
		C("position_blown",    "Overwatch position compromised",            false),
		C("qrf_responded",     "QRF responded to position",                 false),
		C("comms_lost",        "Communications with supported element lost",false),
		C("friendly_contact",  "Supported element took unexpected contact", false),
		C("limited_vis",       "Limited visibility degraded overwatch",     false),
		C("asset_lost",        "Vehicle or asset destroyed / lost",         false),
	],
	"Support": [
		C("none",              "No complications",                          true),
		C("route_interdicted", "Route interdicted by enemy element",        false),
		C("qrf_responded",     "QRF interdicted convoy",                    false),
		C("vehicle_damaged",   "Vehicle damaged or disabled en route",      false),
		C("partial_delivery",  "Partial delivery — some cargo lost",        false),
		C("comms_lost",        "Communications lost during transit",        false),
		C("route_denied",      "Primary route denied — alternate used",     false),
	],
};

// ─── Intel by category ────────────────────────────────────────────────────────

const I = (id, label, exclusive = false) => ({ id, label, exclusive });

const INTEL_BY_CATEGORY = {
	"Direct Action": [
		I("nothing_new",       "Nothing new — intel gap remains",          true),
		I("patrol_timing",     "Enemy patrol patterns and timing confirmed", false),
		I("enemy_strength",    "Enemy force strength and disposition assessed", false),
		I("facility_layout",   "Facility layout and access points mapped", false),
		I("hvt_location",      "HVT or target location updated",           false),
		I("supply_route",      "Supply or logistics route identified",      false),
		I("comms_net",         "Enemy communications network identified",   false),
		I("weapons_cache",     "Weapons cache or arms storage located",     false),
		I("command_element",   "Command element or CP location confirmed",  false),
		I("civilian_network",  "Civilian informant or local contact activated", false),
	],
	"Special Reconnaissance": [
		I("nothing_new",       "Collection objective not met",             true),
		I("patrol_timing",     "Enemy patrol patterns and shift timings confirmed", false),
		I("enemy_strength",    "Enemy force strength and disposition fully assessed", false),
		I("facility_layout",   "Facility layout, access points, and guard positions mapped", false),
		I("hvt_confirmed",     "HVT presence at location confirmed",       false),
		I("supply_route",      "Supply route and traffic patterns identified", false),
		I("air_defense",       "Air defense positions and radar coverage mapped", false),
		I("vehicle_count",     "Enemy vehicle type and count confirmed",   false),
		I("sigint",            "SIGINT / comms intercept achieved",        false),
		I("tunnels_cache",     "Underground network or cache location identified", false),
	],
	"Counterterrorism": [
		I("nothing_new",       "No additional intelligence developed",     true),
		I("network_structure", "Terrorist network structure partially mapped", false),
		I("safe_house",        "Additional safe house locations identified", false),
		I("facilitator",       "Key facilitator or financier identified",  false),
		I("foreign_link",      "Foreign support or state sponsor link confirmed", false),
		I("hvt_location",      "Secondary HVT location or movement established", false),
		I("weapons_cache",     "Weapons or materiel cache discovered",     false),
		I("propaganda",        "Propaganda materials or media recovered",  false),
		I("comms_devices",     "Communications devices or codes recovered", false),
	],
	"Overwatch": [
		I("nothing_new",       "Nothing new — intel gap remains",         true),
		I("patrol_timing",     "Enemy patrol patterns and timing confirmed", false),
		I("enemy_strength",    "Enemy force disposition and strength assessed", false),
		I("position_mapped",   "Enemy defensive positions and fighting holes mapped", false),
		I("supply_route",      "Logistics or supply movement observed",   false),
		I("comms_net",         "Enemy radio or signal communications identified", false),
	],
	"Support": [
		I("nothing_new",       "Nothing new — intel gap remains",         true),
		I("patrol_timing",     "Enemy patrol activity and patterns noted", false),
		I("route_intel",       "Route condition and threat assessment updated", false),
		I("enemy_strength",    "Enemy presence and disposition along route assessed", false),
		I("cache_sighted",     "Possible cache or supply point observed", false),
	],
};

// ─── Questionnaire builder ────────────────────────────────────────────────────

function getQuestionnaire(missionTypeId) {
	const entry   = MISSION_TYPES.find((m) => m.id === missionTypeId);
	const category = entry?.category ?? "Direct Action";

	const outcomes     = OUTCOME_BY_MISSION[missionTypeId]         ?? OUTCOME_BY_MISSION["DA_RAID"];
	const complications = COMPLICATIONS_BY_CATEGORY[category]      ?? COMPLICATIONS_BY_CATEGORY["Direct Action"];
	const intel        = INTEL_BY_CATEGORY[category]               ?? INTEL_BY_CATEGORY["Direct Action"];

	// Screen subtitles vary by category
	const outcomeSub = {
		"Special Reconnaissance": "How did the collection window end?",
		"Counterterrorism":       "What was the outcome of the operation?",
		"Overwatch":              "How was the overwatch position resolved?",
		"Support":                "How did the resupply run end?",
	}[category] ?? "How did the mission end?";

	const intelSub = {
		"Special Reconnaissance": "What intelligence was collected?",
		"Counterterrorism":       "What network intelligence was developed?",
		"Overwatch":              "What was observed from position?",
		"Support":                "What route intelligence was gathered?",
	}[category] ?? "What actionable intelligence was developed?";

	return { outcomes, complications, intel, outcomeSub, intelSub };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toggleMulti(current, id, options) {
	const opt = options.find((o) => o.id === id);
	if (!opt) return current;
	if (opt.exclusive) return [id];
	const withoutExclusive = current.filter(
		(c) => !options.find((o) => o.id === c)?.exclusive,
	);
	if (withoutExclusive.includes(id)) return withoutExclusive.filter((c) => c !== id);
	return [...withoutExclusive, id];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScreenHeader({ phaseNumber, current, total, title, sub }) {
	return (
		<div className='shrink-0 px-4 pt-4 pb-3 border-b border-lines/15'>
			<div className='flex items-center justify-between mb-2.5'>
				<div className='flex items-center gap-2'>
					<span className='font-mono text-[9px] tracking-[0.25em] text-lines/30 uppercase'>
						Phase {phaseNumber}
					</span>
					<span className='text-lines/15'>{"//"}</span>
					<span className='font-mono text-[9px] tracking-[0.25em] text-btn/60 uppercase'>
						{title}
					</span>
				</div>
				<span className='font-mono text-[9px] text-lines/25'>
					{current}/{total}
				</span>
			</div>
			<div className='flex items-center gap-1.5'>
				{SCREENS.map((s, i) => (
					<div key={s} className='flex items-center gap-1.5'>
						<div className={[
							"h-0.5 transition-all duration-300",
							i < current - 1  ? "bg-btn w-6"
							: i === current - 1 ? "bg-btn w-10"
							: "bg-lines/15 w-4",
						].join(" ")} />
						{i < SCREENS.length - 1 && (
							<div className='w-1 h-1 rounded-full bg-lines/10' />
						)}
					</div>
				))}
			</div>
			{sub && (
				<p className='font-mono text-[9px] text-lines/25 mt-2 uppercase tracking-wider'>
					{sub}
				</p>
			)}
		</div>
	);
}

function NavRow({ onBack, onNext, onSubmit, canBack, canNext, isLast, loading }) {
	return (
		<div className='shrink-0 flex items-center justify-between px-4 py-3 border-t border-lines/15 bg-blk/40'>
			<button
				onClick={onBack}
				disabled={!canBack}
				className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-lines/35 hover:text-fontz disabled:opacity-20 disabled:cursor-not-allowed transition-colors'>
				<FontAwesomeIcon icon={faChevronLeft} className='text-[8px]' />
				Back
			</button>
			{isLast ? (
				<button
					onClick={onSubmit}
					disabled={loading}
					className='flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase text-blk bg-btn hover:bg-highlight disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 rounded-sm transition-all'>
					<FontAwesomeIcon icon={faCheck} className='text-[8px]' />
					{loading ? "Saving..." : "File Report"}
				</button>
			) : (
				<button
					onClick={onNext}
					disabled={!canNext}
					className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-btn hover:text-white disabled:opacity-20 disabled:cursor-not-allowed border border-btn/30 hover:border-btn/60 px-3 py-1.5 rounded-sm transition-all'>
					Next
					<FontAwesomeIcon icon={faChevronRight} className='text-[8px]' />
				</button>
			)}
		</div>
	);
}

// ─── Screen 1 — Outcome ───────────────────────────────────────────────────────

function OutcomeScreen({ value, onChange, options }) {
	return (
		<div className='flex flex-col gap-2 p-4'>
			{options.map((opt) => {
				const active = value === opt.id;
				return (
					<button
						key={opt.id}
						onClick={() => onChange(opt.id)}
						className={[
							"w-full flex items-center gap-3 px-3 py-3 rounded-sm border transition-all text-left",
							active ? `${opt.border} ${opt.activeBg}` : "border-lines/10 hover:border-lines/25 bg-transparent hover:bg-white/[0.02]",
						].join(" ")}>
						<span className={["w-2 h-2 rounded-full shrink-0 transition-all", active ? opt.dot : "bg-lines/15"].join(" ")} />
						<div className='flex flex-col gap-0.5 min-w-0'>
							<span className={["font-mono text-[10px] tracking-wider uppercase", active ? opt.color : "text-lines/45"].join(" ")}>
								{opt.label}
							</span>
							<span className='font-mono text-[9px] text-lines/25'>{opt.sub}</span>
						</div>
						{active && (
							<FontAwesomeIcon icon={faCheck} className={`ml-auto text-[9px] shrink-0 ${opt.color}`} />
						)}
					</button>
				);
			})}
		</div>
	);
}

// ─── Screen 2 — Complications ─────────────────────────────────────────────────

function ComplicationsScreen({ value, onChange, options }) {
	return (
		<div className='flex flex-col gap-1.5 p-4'>
			{options.map((opt) => {
				const active = value.includes(opt.id);
				return (
					<button
						key={opt.id}
						onClick={() => onChange(toggleMulti(value, opt.id, options))}
						className={[
							"w-full flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all text-left",
							active ? "border-btn/40 bg-btn/8" : "border-lines/10 hover:border-lines/25 bg-transparent hover:bg-white/[0.02]",
							opt.exclusive ? "border-dashed" : "",
						].join(" ")}>
						<div className={[
							"w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center transition-all",
							active ? "border-btn bg-btn/20" : "border-lines/20 bg-transparent",
						].join(" ")}>
							{active && <FontAwesomeIcon icon={faCheck} className='text-btn text-[7px]' />}
						</div>
						<span className={[
							"font-mono text-[10px] tracking-wider",
							active ? "text-btn" : "text-lines/40",
							opt.exclusive ? "uppercase" : "",
						].join(" ")}>
							{opt.label}
						</span>
					</button>
				);
			})}
		</div>
	);
}

// ─── Screen 3 — Casualties ────────────────────────────────────────────────────

function CasualtiesScreen({ value, note, onSelect, onNote }) {
	return (
		<div className='flex flex-col gap-3 p-4'>
			<div className='flex flex-col gap-2'>
				{CASUALTY_OPTIONS.map((opt) => {
					const active = value === opt.id;
					return (
						<button
							key={opt.id}
							onClick={() => onSelect(opt.id)}
							className={[
								"w-full flex items-center gap-3 px-3 py-3 rounded-sm border transition-all text-left",
								active ? `${opt.border} ${opt.activeBg}` : "border-lines/10 hover:border-lines/25 bg-transparent hover:bg-white/[0.02]",
							].join(" ")}>
							<span className={[
								"w-2 h-2 rounded-full shrink-0 transition-all",
								active ?
									opt.id === "none"          ? "bg-green-400"
									: opt.id === "injured"     ? "bg-yellow-400"
									: opt.id === "multiple_wia" ? "bg-orange-400"
									: opt.id === "missing"     ? "bg-purple-400"
									: "bg-red-400"
								: "bg-lines/15",
							].join(" ")} />
							<span className={[
								"font-mono text-[10px] tracking-wider uppercase",
								active ? opt.color : "text-lines/45",
							].join(" ")}>
								{opt.label}
							</span>
							{active && <FontAwesomeIcon icon={faCheck} className={`ml-auto text-[9px] shrink-0 ${opt.color}`} />}
						</button>
					);
				})}
			</div>
			{value && value !== "none" && (
				<div className='flex flex-col gap-1.5 mt-1'>
					<label className='font-mono text-[9px] tracking-widest text-lines/30 uppercase'>
						Operator / Circumstance (optional)
					</label>
					<textarea
						value={note}
						onChange={(e) => onNote(e.target.value)}
						maxLength={200}
						rows={2}
						placeholder='e.g. NOMAD — KIA during exfil under QRF fire'
						className='w-full bg-blk/60 border border-lines/15 focus:border-btn/40 rounded-sm px-3 py-2 font-mono text-[10px] text-fontz/70 placeholder:text-lines/20 resize-none outline-none transition-colors'
					/>
					<span className='font-mono text-[8px] text-lines/20 text-right'>{note.length}/200</span>
				</div>
			)}
		</div>
	);
}

// ─── Screen 4 — Intel ─────────────────────────────────────────────────────────

function IntelScreen({ value, notes, onChange, onNotes, options }) {
	return (
		<div className='flex flex-col gap-3 p-4'>
			<div className='flex flex-col gap-1.5'>
				{options.map((opt) => {
					const active = value.includes(opt.id);
					return (
						<button
							key={opt.id}
							onClick={() => onChange(toggleMulti(value, opt.id, options))}
							className={[
								"w-full flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all text-left",
								active ? "border-indigo-500/40 bg-indigo-500/8" : "border-lines/10 hover:border-lines/25 bg-transparent hover:bg-white/[0.02]",
								opt.exclusive ? "border-dashed" : "",
							].join(" ")}>
							<div className={[
								"w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center transition-all",
								active ? "border-indigo-400 bg-indigo-400/20" : "border-lines/20 bg-transparent",
							].join(" ")}>
								{active && <FontAwesomeIcon icon={faCheck} className='text-indigo-400 text-[7px]' />}
							</div>
							<span className={[
								"font-mono text-[10px] tracking-wider",
								active ? "text-indigo-300" : "text-lines/40",
								opt.exclusive ? "uppercase" : "",
							].join(" ")}>
								{opt.label}
							</span>
						</button>
					);
				})}
			</div>
			<div className='flex flex-col gap-1.5 mt-1'>
				<label className='font-mono text-[9px] tracking-widest text-lines/30 uppercase'>
					Field notes (optional)
				</label>
				<textarea
					value={notes}
					onChange={(e) => onNotes(e.target.value)}
					maxLength={200}
					rows={2}
					placeholder='Anything worth noting for the record...'
					className='w-full bg-blk/60 border border-lines/15 focus:border-btn/40 rounded-sm px-3 py-2 font-mono text-[10px] text-fontz/70 placeholder:text-lines/20 resize-none outline-none transition-colors'
				/>
				<span className='font-mono text-[8px] text-lines/20 text-right'>{notes.length}/200</span>
			</div>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PhaseReportSheet({ mission, phaseNumber, onSave }) {
	const [screen, setScreen]               = useState(1);
	const [outcome, setOutcome]             = useState(null);
	const [complications, setComplications] = useState([]);
	const [casualties, setCasualties]       = useState(null);
	const [casualtyNote, setCasualtyNote]   = useState("");
	const [intelDeveloped, setIntelDeveloped] = useState([]);
	const [fieldNotes, setFieldNotes]       = useState("");
	const [loading, setLoading]             = useState(false);

	const q = useMemo(
		() => getQuestionnaire(mission?.missionType),
		[mission?.missionType],
	);

	const screenMeta = {
		1: { title: "Outcome",       sub: q.outcomeSub },
		2: { title: "Complications", sub: "Select all that apply" },
		3: { title: "Casualties",    sub: "Personnel status" },
		4: { title: "Intel",         sub: q.intelSub },
	};

	const canProceed = {
		1: !!outcome,
		2: complications.length > 0,
		3: !!casualties,
		4: intelDeveloped.length > 0,
	};

	const handleSubmit = async () => {
		if (!canProceed[4]) return;
		setLoading(true);
		const phaseData = {
			phaseNumber,
			province:    mission?.province    ?? null,
			missionType: mission?.missionType ?? null,
			objectives:  (mission?.generator?.selectedLocations ?? []).map((l) => l.name ?? l),
			outcome,
			complications,
			casualties,
			casualtyNote:     casualtyNote.trim()  || null,
			intelDeveloped,
			notes:            fieldNotes.trim()    || null,
			generatorSnapshot: {
				infilPoint:  mission?.generator?.infilPoint  ?? null,
				exfilPoint:  mission?.generator?.exfilPoint  ?? null,
				rallyPoint:  mission?.generator?.rallyPoint  ?? null,
				infilMethod: mission?.generator?.infilMethod ?? null,
				exfilMethod: mission?.generator?.exfilMethod ?? null,
			},
			createdAt: new Date().toISOString(),
		};
		try { await onSave(phaseData); }
		finally { setLoading(false); }
	};

	const { title, sub } = screenMeta[screen];

	return (
		<div className='flex flex-col h-full bg-blk/95 overflow-hidden'>
			<ScreenHeader
				phaseNumber={phaseNumber}
				current={screen}
				total={SCREENS.length}
				title={title}
				sub={sub}
			/>

			<div className='flex-1 min-h-0 overflow-y-auto'>
				{screen === 1 && (
					<OutcomeScreen value={outcome} onChange={setOutcome} options={q.outcomes} />
				)}
				{screen === 2 && (
					<ComplicationsScreen value={complications} onChange={setComplications} options={q.complications} />
				)}
				{screen === 3 && (
					<CasualtiesScreen
						value={casualties}
						note={casualtyNote}
						onSelect={setCasualties}
						onNote={setCasualtyNote}
					/>
				)}
				{screen === 4 && (
					<IntelScreen
						value={intelDeveloped}
						notes={fieldNotes}
						onChange={setIntelDeveloped}
						onNotes={setFieldNotes}
						options={q.intel}
					/>
				)}
			</div>

			<NavRow
				onBack={() => setScreen((s) => Math.max(1, s - 1))}
				onNext={() => setScreen((s) => Math.min(SCREENS.length, s + 1))}
				onSubmit={handleSubmit}
				canBack={screen > 1}
				canNext={canProceed[screen]}
				isLast={screen === SCREENS.length}
				loading={loading}
			/>
		</div>
	);
}

// ─── PropTypes ────────────────────────────────────────────────────────────────

PhaseReportSheet.propTypes = {
	mission:     PropTypes.object.isRequired,
	phaseNumber: PropTypes.number.isRequired,
	onSave:      PropTypes.func.isRequired,
	onClose:     PropTypes.func,
};

ScreenHeader.propTypes = {
	phaseNumber: PropTypes.number,
	current:     PropTypes.number,
	total:       PropTypes.number,
	title:       PropTypes.string,
	sub:         PropTypes.string,
};

NavRow.propTypes = {
	onBack:   PropTypes.func,
	onNext:   PropTypes.func,
	onSubmit: PropTypes.func,
	canBack:  PropTypes.bool,
	canNext:  PropTypes.bool,
	isLast:   PropTypes.bool,
	loading:  PropTypes.bool,
};

OutcomeScreen.propTypes = {
	value:    PropTypes.string,
	onChange: PropTypes.func,
	options:  PropTypes.array,
};

ComplicationsScreen.propTypes = {
	value:    PropTypes.array,
	onChange: PropTypes.func,
	options:  PropTypes.array,
};

CasualtiesScreen.propTypes = {
	value:    PropTypes.string,
	note:     PropTypes.string,
	onSelect: PropTypes.func,
	onNote:   PropTypes.func,
};

IntelScreen.propTypes = {
	value:    PropTypes.array,
	notes:    PropTypes.string,
	onChange: PropTypes.func,
	onNotes:  PropTypes.func,
	options:  PropTypes.array,
};
