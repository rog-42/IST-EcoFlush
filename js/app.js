// app.js
import {
    loadHistory,
    saveHistory,
    loadFriends,
    saveFriends,
    getTodayKey,
    getYesterdayKey
} from "./storage.js";

import {
    createEmptyDay,
    addLiters,
    addShowerLiters,
    estimatePastDays
} from "./tracking.js";

import {
    randomMonthConsumption,
    computeMonthlyTotal,
    buildLeaderboard
} from "./leaderboard.js";

import {
  generateDailyChallenges,
  getChallengeState,
  completeChallenge,
  claimChallengeXP
} from "./challengeSystem.js";

import { newsFeed} from "./newsFeed.js";

const STORAGE_KEY = "waterTracker:v1";

const app = Vue.createApp({
    data() {
        return {
            // tracking
            totalLiters: 0,
            showerMinutesInput: 0,
            litersInput: 0,

            // constants / averages
            halfFlushLiters: 3,
            fullFlushLiters: 6,
            showerLitersPerMinute: 10,
            dailyGoalConsumption: 110,      // according to EPAL
            averageDailyConsumption: 134,   // according to EPAL

            // mascot
            mascotState: "happy",
            mascotTimeout: null,

            // gamification
            userXP: 0,
            level: 1,

            // challenges
            challenges: [],           // active challenge objects
            completedChallenges: [],
            claimedChallenges: [],

            newsFeed: newsFeed,

            // persistence
            history: {},
            friends: [],

            // UI
            screen: "home",
            todayString: new Date().toDateString(),

            xpBurst: { visible: false, amount: 0, source: '' },

            waterReal: {
                visible: false,
                reading: null,
                countdown: 24 * 60 * 60, // 24 hours in seconds
                interval: null,
                submitted: false
            },

            // fake values for the community tab, fell free to change
            community: {
                joinedCause: false,
                
                causeGoal: 100000,
                causeProgress: 0.42, 
                causeTotal: 42000,  // 42% toward 100k XP
                causeUserCurrentXP: 0, 
                
                joinedSchool: false,
                fakePlacementSchool: 12,
                fakeTotalSchool: 87,
                
                joinedEpal: false,
                fakePlacementEpal: 34,
                fakeTotalEpal: 210
            },

            communityPopup: {
                visible: false,
                type: null,
                title: "",
                description: ""
            }
        };
    },

    created() {
        // load persisted app state (safe defaults)
        this.loadState();

        // load history and friends
        this.history = loadHistory();
        this.friends = loadFriends();
        // If first time using the app, create default friends
        if (!this.friends || this.friends.length === 0) {
            this.friends = [
                {
                    name: "Inês Gotável",
                    liters: randomMonthConsumption(this.averageDailyConsumption),
                    level: Math.floor(Math.random() * 5) + 1
                },
                {
                    name: "Augusto Clismo",
                    liters: randomMonthConsumption(this.averageDailyConsumption),
                    level: Math.floor(Math.random() * 5) + 1
                }
            ];

            saveFriends(this.friends);
        }

        // ensure today's entry exists and set today's total
        this.refreshForNewDay();

        // estimate past days if needed and persist
        this.history = estimatePastDays(this.history, this.dailyGoalConsumption - 10);
        saveHistory(this.history);

        // Ensure yesterday exists (covers the 1st-of-month case)
        const yesterdayKey = getYesterdayKey();
        if (!this.history[yesterdayKey]) {
            this.history[yesterdayKey] = createEmptyDay();
            this.history[yesterdayKey].liters = Math.round(this.dailyGoalConsumption - 10);
            saveHistory(this.history);
        }

        // generate today's challenges and sync local view
        this.generateChallengesAndSync();
    },

    computed: {
        pageTitle() {
            return {
                home: "EcoFlush",
                tracking: "Rastreador de Água",
                news: "Notícias",
                community: "Comunidade",
                shop: "Loja de Recompensas"
            }[this.screen] || "";
        },

        pageSubtitle() {
            return {
                home: "Bem-vindo à EcoFlush!",
                tracking: "Regista o teu consumo diário!",
                news: "Últimas notícias sobre água e sustentabilidade.",
                community: "Liga-te à tua comunidade!",
                shop: "Troca XP por recompensas!"
            }[this.screen] || "";
        },

        todaysInfo() {
            const goal = this.dailyGoalConsumption;
            const today = this.totalLiters;

            const yesterdayKey = getYesterdayKey();
            const yesterday = this.history[yesterdayKey]?.liters ?? 0;

            // 1. User exceeded the daily goal
            if (today > goal) {
                const diff = today - goal;
                return {
                    type: "over_goal",
                    amount: diff,
                    message: `😢 Hoje gastaste <strong>${diff}L</strong> acima da meta de ${this.dailyGoalConsumption}L. Amanhã voltamos ao foco!`
                };
            }

            // 2. User stayed under the goal → compare with yesterday
            const diff = yesterday - today;

            if (diff > 0) {
                return {
                    type: "saved_vs_yesterday",
                    amount: diff,
                    message: `🌱 Boa! Hoje poupaste <strong>${diff}L</strong> em relação a ontem. Continua assim!`
                };
            }

            if (diff < 0) {
                return {
                    type: "worse_than_yesterday",
                    amount: -diff,
                    message: `💧 Hoje gastaste <strong>${-diff}L</strong> a mais do que ontem. Ainda vais a tempo de equilibrar!`
                };
            }

            // 3. Same usage as yesterday
            return {
                type: "same_as_yesterday",
                amount: 0,
                message: `📊 Hoje estás igual a ontem. Consistência também conta!`
            };
        },

        myMonthlyTotal() {
            return computeMonthlyTotal(this.history);
        },

        sortedLeaderboard() {
            return buildLeaderboard(this.myMonthlyTotal, this.level, this.friends);
        },

        sortedFriends() {
            return [...this.friends].sort((a, b) => b.level - a.level);
        },

        // map of challenge id -> numeric XP for fast lookups in templates
        challengeXPMap() {
            const map = {};
            (this.challenges || []).forEach(c => {
            if (c && c.id) map[c.id] = Number(c.xp) || 0;
            });
            return map;
        }
    },

    methods: {
        // ---------- persistence ----------
        loadState() {
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const s = JSON.parse(raw);
            this.totalLiters = s.totalLiters || 0;
            this.mascotState = s.mascotState || "happy";
            this.userXP = s.userXP || 0;
            this.level = s.level || 1;
            this.showerMinutesInput = s.showerMinutesInput || 0;
            this.litersInput = s.litersInput || 0;
            if (s.community) {this.community = s.community;}
          } catch (e) {
            console.warn("Failed to load app state", e);
          }
        },

        saveState() {
          const s = {
            totalLiters: this.totalLiters,
            mascotState: this.mascotState,
            userXP: this.userXP,
            level: this.level,
            showerMinutesInput: this.showerMinutesInput,
            litersInput: this.litersInput,
            community: this.community
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
          } catch (e) {
            console.warn("Failed to save app state", e);
          }
        },

        resetAll() {
            localStorage.clear();
            location.reload();
        },

        // ---------- daily refresh ----------
        refreshForNewDay() {
            const todayKey = getTodayKey();
            const history = loadHistory();

            const isNewDay = !history[todayKey];

            if (isNewDay) {
                // create today's entry
                history[todayKey] = createEmptyDay();
                saveHistory(history);

                // reset mascot for a new day
                if (this.mascotState === "sad") {
                    this.mascotState = "happy";
                }

                // generate new challenges
                this.generateChallengesAndSync();
            }

            // always update in-memory state
            this.history = history;
            this.totalLiters = history[todayKey].liters || 0;

            // persist app-level state
            this.saveState();
        },

        //---------- mascot ----------
        updateMascotStateFromWater() {
            if (this.totalLiters > this.dailyGoalConsumption) {
                this.mascotState = "sad";
            } else if (this.mascotState === "sad") {
                // Only return to happy if not in superhappy mode
                this.mascotState = "happy";
            }
        },


        // ---------- tracking actions ----------
        changeScreen(target) {
            this.screen = target;
        },

        addHalfFlush() {
            this.totalLiters = addLiters(this.totalLiters, this.halfFlushLiters);
            this.updateToday();
            this.updateMascotStateFromWater();

            // auto-complete the half_flush practice every time the button is pressed
            completeChallenge("half_flush");
            const xp = claimChallengeXP("half_flush");
            if (xp > 0) this.addXP(xp, "half_flush");
            this.refreshLocalChallengeState();
            
            this.saveState();
        },

        addFullFlush() {
            this.totalLiters = addLiters(this.totalLiters, this.fullFlushLiters);
            this.updateToday();
            this.updateMascotStateFromWater();
            this.saveState();
        },

        addShower() {
            const minutes = Number(this.showerMinutesInput) || 0;
            if (minutes <= 0) return;

            this.totalLiters = addShowerLiters(
                this.totalLiters,
                minutes,
                this.showerLitersPerMinute
            );

            this.updateToday();
            this.updateMascotStateFromWater();

            // conditional auto-complete for short shower
            if (minutes <= 5) {
                completeChallenge("short_shower");
                const xp = claimChallengeXP("short_shower");
                if (xp > 0) this.addXP(xp, "short_shower");
            }
            this.showerMinutesInput = 0;
            this.refreshLocalChallengeState();
            this.saveState();
        },

        addGeneralWaste() {
            const liters = Number(this.litersInput) || 0;
            if (liters <= 0) return;

            this.totalLiters = addLiters(this.totalLiters, liters);
            this.updateToday();
            this.updateMascotStateFromWater();

            // no default auto-challenge for general waste; add if desired
            this.litersInput = 0;
            this.refreshLocalChallengeState();
            this.saveState();
        },

        updateToday() {
            const todayKey = getTodayKey();
            this.history[todayKey] = { liters: this.totalLiters };
            saveHistory(this.history);
            this.saveState();
        },

        promptAddFriend() {
            const name = prompt("Enter your friend's name:");
            if (!name || !name.trim()) return;

            this.friends.push({
                name: name.trim(),
                liters: randomMonthConsumption(this.averageDailyConsumption),
                level: Math.floor(Math.random() * 5) + 1  // random level 1-5
            });

            saveFriends(this.friends);
        },

        openCommunityPopup(type) {
            this.communityPopup.type = type;
            this.communityPopup.visible = true;

            if (type === "school") {
                this.communityPopup.title = "Competição Escolar";
                this.communityPopup.description = "Neste demo só existe uma escola disponível.";
            }

            if (type === "epal") {
                this.communityPopup.title = "Liga Local";
                this.communityPopup.description = "Neste demo só existe uma zona EPAL disponível.";
            }

            if (type === "cause") {
                this.communityPopup.title = "Missão Global";
                this.communityPopup.description =
                    "Objetivo global: atingir 1.000.000 XP para financiar a construção de uma casa de banho comunitária numa escola em Moçambique. \
                    Cada XP ganho pelos utilizadores contribui diretamente para este objetivo.";
            }
        },

        joinCommunityItem() {
            const t = this.communityPopup.type;

            if (t === "school") {
                this.community.joinedSchool = true;
                this.addXP(20, "join_competition");
            }
            if (t === "epal"){
                this.community.joinedEpal = true;
                this.addXP(20, "join_competition");
            }
            if (t === "cause"){
                this.community.joinedCause = true;
                this.addXP(50, "join_global_cause");
            }

            this.communityPopup.visible = false;
            this.saveState();
        },

        // ---------- XP / leveling ----------
        getChallengeXP(id) {
            return this.challengeXPMap[id] || 0;
        },
        
        addXP(amount, source = '') {
            amount = Number(amount) || 0;
            if (amount <= 0) return;

            // update XP and level
            this.userXP = (this.userXP || 0) + amount;
            const newLevel = Math.floor(this.userXP / 200) + 1;
            if (newLevel > this.level) this.level = newLevel;

            // contriute XP for global cause
            if (this.community.joinedCause) {
                // Add to user's personal contribution
                this.community.causeUserCurrentXP += amount;

                // Add to global total
                this.community.causeTotal += amount;

                // Update progress (0 → 1)
                this.community.causeProgress =
                    Math.min(this.community.causeTotal / this.community.causeGoal, 1);
            }

            // show the bottom toast
            this.showXPBurst(amount, source);

            // trigger temporary mascot superhappy state
            const previousState = this.mascotState;
            this.mascotState = "superhappy";
            if (this.mascotTimeout) clearTimeout(this.mascotTimeout);

            // After 4 seconds, mascot returns to happy (unless sad)
            this.mascotTimeout = setTimeout(() => {
                this.mascotState = previousState;
            }, 4000);

            // persist state (keeps your existing save behavior)
            if (typeof this.saveState === 'function') this.saveState();
        },

        showXPBurst(amount, source = '') {
            amount = Number(amount) || 0;
            if (amount <= 0) return;
            this.xpBurst.amount = amount;
            this.xpBurst.source = source || 'XP awarded';
            this.xpBurst.visible = true;
            if (this._xpBurstTimer) clearTimeout(this._xpBurstTimer);
            this._xpBurstTimer = setTimeout(() => {
            this.xpBurst.visible = false;
            this._xpBurstTimer = null;
            }, 2200);
        },
        
        // ---------- challenges API wrappers ----------
        generateChallengesAndSync() {
            this.challenges = generateDailyChallenges();
            this.refreshLocalChallengeState();
        },

        refreshLocalChallengeState() {
            const state = getChallengeState();
            this.challenges = state.active || [];
            this.completedChallenges = state.completed || [];
            this.claimedChallenges = state.claimed || [];
        },

        claimXPFor(challengeId) {
            const xp = claimChallengeXP(challengeId);
            if (xp > 0) {
                this.addXP(xp);
                this.refreshLocalChallengeState();
            } 
        },

        markManualPractice(id) {
            completeChallenge(id);
            this.refreshLocalChallengeState();
        },

        
        // ---------- WaterReal ----------
        openWaterReal() {
            this.waterReal.visible = true;
            this.startWaterRealCountdown();
        },

        startWaterRealCountdown() {
            if (this.waterReal.interval) return;

            this.waterReal.interval = setInterval(() => {
                if (this.waterReal.countdown > 0) {
                this.waterReal.countdown--;
                } else {
                clearInterval(this.waterReal.interval);
                this.waterReal.interval = null;
                }
            }, 1000);
        },

        fakeUploadPhoto() {
            const fakeReading = this.myMonthlyTotal;
            this.waterReal.reading = fakeReading;

            // XP reward
            const xpReward = 30;
            this.addXP(xpReward, "water_real");

            // Mark as submitted
            this.waterReal.submitted = true;

            // Close modal smoothly
            this.waterReal.visible = false;
        },
    },

    mounted() {
        // refresh daily challenges and today's total if day changed while app was open
        setInterval(() => {
          const today = new Date().toDateString();
          if (today !== this.todayString) {
            this.todayString = today;
            this.refreshForNewDay();
          }
        }, 60_000);
    }
});

app.mount("#app");
