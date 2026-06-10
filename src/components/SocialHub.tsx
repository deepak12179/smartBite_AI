import React, { useState } from "react";
import { MessageSquare, ThumbsUp, Send, Share2, Award, Users, Flame, Plus, Apple, CheckCircle2 } from "lucide-react";
import { UserProfile, FoodLog } from "../types";

interface SocialHubProps {
  profile: UserProfile;
  logs: FoodLog[];
}

export default function SocialHub({ profile, logs }: SocialHubProps) {
  const [feedPosts, setFeedPosts] = useState([
    {
      id: "post1",
      name: "Riya Verma",
      avatarBg: "bg-pink-100 text-pink-700",
      content: "Just logged my morning oats with blueberries today! Got an AI food score of 88. Helping me stay aligned with my balanced nutrition plans.",
      likes: 12,
      commentsCount: 2,
      time: "2 hours ago",
      tags: ["Breakfast", "Clean Eating"],
      hasLiked: false
    },
    {
      id: "post2",
      name: "Aman Gupta",
      avatarBg: "bg-blue-100 text-blue-700",
      content: "Crushed a 15g protein snack post-workout. Scanned grilled eggwhites using the camera – 94 accuracy. Streaks multiplier active!",
      likes: 8,
      commentsCount: 1,
      time: "4 hours ago",
      tags: ["Snack", "High Protein"],
      hasLiked: false
    }
  ]);

  const [shareText, setShareText] = useState("");
  const [sharedAlert, setSharedAlert] = useState(false);

  const friendsLeaderboard = [
    { name: "Aman Gupta", points: 195, streak: 5, rank: 1, avatarBg: "bg-blue-100 text-blue-700" },
    { name: "Riya Verma", points: 140, streak: 4, rank: 2, avatarBg: "bg-pink-100 text-pink-700" },
    { name: "John Doe (You)", points: profile.points, streak: profile.streakCount, rank: 3, avatarBg: "bg-emerald-100 text-emerald-800" },
    { name: "Kirti Roy", points: 85, streak: 2, rank: 4, avatarBg: "bg-purple-100 text-purple-700" }
  ].sort((a, b) => b.points - a.points);

  const handleShareLogToggle = () => {
    if (logs.length === 0) {
      setShareText("Ready to build strong nutrition habits. Joined SmartBite AI!");
    } else {
      const topLog = logs[0];
      setShareText(`Just analyzed and ate "${topLog.foodName}"! AI Score: ${topLog.healthScore}/100 with recommendations '${topLog.recommendation}'. Keeping my daily health calorie streak alive! 🥗🔥`);
    }
  };

  const publishFeedPost = () => {
    if(!shareText.trim()) return;

    const newPost = {
      id: "post_" + Date.now(),
      name: profile.displayName + " (You)",
      avatarBg: "bg-emerald-100 text-emerald-800",
      content: shareText,
      likes: 0,
      commentsCount: 0,
      time: "Just now",
      tags: ["SmartBite Log"],
      hasLiked: false
    };

    setFeedPosts([newPost, ...feedPosts]);
    setShareText("");
    setSharedAlert(true);
    setTimeout(() => setSharedAlert(false), 3000);
  };

  const toggleLikePost = (postId: string) => {
    setFeedPosts(feedPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.hasLiked ? post.likes - 1 : post.likes + 1,
          hasLiked: !post.hasLiked
        };
      }
      return post;
    }));
  };

  return (
    <div id="social_accountability_hub" className="space-y-8 text-left text-stone-800">
      
      {/* Social Title */}
      <div className="bg-gradient-to-r from-stone-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 rounded-full text-indigo-300 text-[10px] font-bold font-mono uppercase tracking-wide">
            👥 Social accountability panel
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-sans">Friends and Feed Core</h2>
          <p className="text-stone-300 text-xs sm:text-sm font-semibold max-w-lg">
            Studies show social accountability doubles meal consistency. Share scanned quality scores, comment on logs, and compete!
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Scoreboard ranking list */}
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div>
            <span className="text-[10px] font-bold font-mono tracking-wider text-stone-500 uppercase block">RANKINGS</span>
            <h3 className="font-sans font-bold text-base text-stone-900">Friends Scoreboard</h3>
          </div>

          <div className="space-y-3">
            {friendsLeaderboard.map((friend, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-xl flex items-center justify-between border transition-all ${
                  friend.name.includes("You") 
                    ? "bg-emerald-50/80 border-emerald-300 shadow-sm" 
                    : "bg-stone-50/55 border-stone-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 font-mono text-[10px] font-black text-stone-400 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center">
                    #{idx + 1}
                  </div>
                  <div className={`w-8 h-8 rounded-full ${friend.avatarBg} flex items-center justify-center font-bold text-xs shrink-0`}>
                    {friend.name.split(" ")[0][0]}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block truncate max-w-[120px]">{friend.name}</span>
                    <span className="text-[10px] font-mono font-bold text-amber-500 flex items-center gap-0.5">
                      🔥 {friend.streak} day streak
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-xs text-stone-900 font-mono block">{friend.points} XP</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-stone-50 border border-stone-100 rounded-xl">
            <span className="text-[10px] font-bold text-stone-400 font-mono block">MULTIPLIER ALERTS</span>
            <p className="text-[10px] text-stone-500 font-semibold leading-relaxed mt-1">
              Maintained streaks of 5+ days invite an extra 20% experience multiplier to scoreboard points!
            </p>
          </div>
        </div>

        {/* Right: Posts and Share controls */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Share Box */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-sans font-bold text-sm text-stone-900">Share Meal Success</h3>
            
            <div className="space-y-3">
              <textarea
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                placeholder="Publish meal milestones, advice, or targets with your community..."
                className="w-full bg-stone-50 border border-stone-200 p-3.5 rounded-xl text-xs sm:text-sm text-stone-700 focus:outline-none focus:border-emerald-500 font-semibold min-h-[80px]"
              />

              <div className="flex justify-between items-center gap-4 flex-wrap">
                <button
                  onClick={handleShareLogToggle}
                  className="text-emerald-700 hover:text-emerald-900 text-xs font-bold underline cursor-pointer"
                >
                  📝 Import current meal log details
                </button>

                <button
                  onClick={publishFeedPost}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition duration-200 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post to Feed</span>
                </button>
              </div>
            </div>

            {sharedAlert && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Success! Shared tracking meal to the community stream.</span>
              </div>
            )}
          </div>

          {/* Stream list comments */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-stone-400 font-mono tracking-wider block">COMMUNITY INSTANT STREAM</span>
            
            {feedPosts.map((post) => (
              <div key={post.id} className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full ${post.avatarBg} flex items-center justify-center font-bold text-xs`}>
                      {post.name[0]}
                    </div>
                    <div>
                      <strong className="text-xs text-stone-900 block">{post.name}</strong>
                      <span className="text-[10px] text-stone-400 font-mono font-semibold">{post.time}</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    {post.tags.map((tag, idx) => (
                      <span key={idx} className="text-[9px] font-mono font-bold bg-stone-100 text-stone-500 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed font-semibold">{post.content}</p>

                <div className="pt-3 border-t border-stone-100 flex gap-4 text-[11px] text-stone-400">
                  <button 
                    onClick={() => toggleLikePost(post.id)}
                    className={`flex items-center gap-1 hover:text-emerald-600 transition cursor-pointer font-bold ${
                      post.hasLiked ? "text-emerald-600" : ""
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${post.hasLiked ? "fill-emerald-600" : ""}`} />
                    <span>{post.likes} Likes</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{post.commentsCount} Comments</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
