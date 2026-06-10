import React from "react";
import { Award, Flame, Zap, ShieldCheck, Star, Users, CheckCircle, HelpCircle, Trophy, Sparkles, Activity, Apple, CookingPot, Circle } from "lucide-react";
import { Challenge, UserProfile } from "../types";
import { BADGES_LIST } from "../lib/storage";

interface ChallengesProps {
  profile: UserProfile;
  challenges: Challenge[];
}

export default function Challenges({ profile, challenges }: ChallengesProps) {
  
  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "Utensils": return <Trophy className="w-6 h-6" />;
      case "Flame": return <Flame className="w-6 h-6" />;
      case "Award": return <Award className="w-6 h-6" />;
      case "Zap": return <Zap className="w-6 h-6" />;
      case "ShieldAlert": return <Activity className="w-6 h-6" />;
      case "Sparkles": return <Sparkles className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  const getChallengeIcon = (iconName: string) => {
    switch (iconName) {
      case "Wheat": return <CookingPot className="w-5 h-5 text-indigo-500" />;
      case "Activity": return <Activity className="w-5 h-5 text-violet-500" />;
      case "Apple": return <Apple className="w-5 h-5 text-emerald-500" />;
      default: return <Star className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div id="gamified_challenges_cabinet" className="space-y-8 text-left text-stone-800">
      
      {/* Gamified Header status */}
      <div className="bg-gradient-to-r from-stone-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 rounded-full text-emerald-300 text-[10px] font-bold font-mono uppercase tracking-wide">
            🏆 Gamified achievements cabinet
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-sans">Streaks &amp; Gamification Levels</h2>
          <p className="text-stone-300 text-xs sm:text-sm font-semibold max-w-lg">
            Stay consistent! Log your plates daily to trigger scoring multipliers, level up. and complete weekly goals.
          </p>
        </div>

        <div className="flex gap-4 self-stretch sm:self-auto pt-4 sm:pt-0 border-t sm:border-0 border-white/10">
          <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-center flex-1 sm:flex-initial sm:min-w-[100px]">
            <span className="block text-[8px] font-bold text-stone-400 font-mono">STREAK INDEX</span>
            <span className="text-lg font-black text-amber-400 block mt-0.5">🔥 {profile.streakCount} days</span>
          </div>

          <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-center flex-1 sm:flex-initial sm:min-w-[100px]">
            <span className="block text-[8px] font-bold text-stone-400 font-mono">TOTAL REWARDS</span>
            <span className="text-lg font-black text-emerald-400 block mt-0.5">{profile.points} XP</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        
        {/* Left: Active Challenges */}
        <div className="md:col-span-7 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-stone-200">
            <div>
              <span className="text-[10px] font-bold font-mono tracking-wider text-stone-400 uppercase">QUEST LOG</span>
              <h3 className="text-lg font-bold text-stone-900">Active Tracking Challenges</h3>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full">
              {challenges.filter(c => !c.completed).length} active
            </span>
          </div>

          <div className="space-y-4">
            {challenges.map((challenge) => {
              const percent = Math.min(100, Math.round((challenge.progress / challenge.durationDays) * 100));

              return (
                <div 
                  key={challenge.id} 
                  className={`p-5 rounded-2xl border transition-all ${
                    challenge.completed 
                      ? "bg-stone-50/60 border-stone-200/80 opacity-75" 
                      : "bg-white border-stone-200 hover:border-emerald-500/55 shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center shrink-0 mt-0.5">
                        {getChallengeIcon(challenge.icon)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                          <span>{challenge.title}</span>
                          {challenge.completed && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] rounded font-extrabold uppercase">
                              <CheckCircle className="w-2.5 h-2.5" />
                              <span>Done</span>
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-stone-500 font-semibold mt-0.5">{challenge.description}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-emerald-700 font-black text-xs font-mono block">+{challenge.pointsValue} XP</span>
                      <span className="text-[10px] text-stone-400 font-mono font-bold mt-0.5 block">
                        {challenge.progress} / {challenge.durationDays} days
                      </span>
                    </div>
                  </div>

                  {/* Progress bar info */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold text-stone-400 font-mono">
                      <span>PROGRESS STATUS</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-550 ${
                          challenge.completed ? "bg-emerald-500" : "bg-indigo-600"
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Unlocked Badges */}
        <div className="md:col-span-5 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-stone-200">
            <div>
              <span className="text-[10px] font-bold font-mono tracking-wider text-stone-400 uppercase">CABINET DOORS</span>
              <h3 className="text-lg font-bold text-stone-900">Your Earned Badges</h3>
            </div>
            <span className="text-xs text-stone-500 font-mono font-bold">
              {profile.badges.length} / {BADGES_LIST.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {BADGES_LIST.map((badge) => {
              const isUnlocked = profile.badges.includes(badge.id);

              return (
                <div 
                  key={badge.id}
                  className={`p-4 rounded-2xl border text-center transition-all flex flex-col justify-between items-center gap-1.5 ${
                    isUnlocked 
                      ? "bg-stone-500/5 border-stone-200 shadow-sm" 
                      : "bg-stone-150/40 border-stone-200/50 opacity-40 select-none"
                  }`}
                >
                  <div className="space-y-2.5 flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${
                      isUnlocked ? badge.color : "from-stone-300 to-stone-400"
                    } flex items-center justify-center text-white shadow-md relative`}>
                      {getBadgeIcon(badge.icon)}
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-stone-900/60 rounded-full flex items-center justify-center font-black text-[10px] text-white">
                          🔒
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-stone-900 truncate max-w-[120px]">{badge.title}</h4>
                      <p className="text-[10px] text-stone-500 font-medium leading-tight mt-0.5 max-w-[120px] mx-auto line-clamp-2">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded mt-2 uppercase ${
                    isUnlocked ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-500"
                  }`}>
                    {isUnlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
