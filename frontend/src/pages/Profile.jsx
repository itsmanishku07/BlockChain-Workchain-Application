import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useAuth } from "../context/AuthContext";
import { User, Award, Edit2, Save, Loader2, AlertCircle, ShieldAlert } from "lucide-react";

const Profile = () => {
  const { account, isClient } = useWeb3();
  const { currentUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [profileData, setProfileData] = useState({
    name: "New User",
    title: isClient ? "Web3 Project Manager" : "Full Stack Web3 Developer",
    bio: "I am passionate about building decentralized applications.",
    hourlyRate: "0.00",
    location: "Global",
    website: "https://",
    github: "https://github.com/",
    skills: ["React", "Solidity", "Ethers.js"]
  });

  const [skillsString, setSkillsString] = useState(profileData.skills.join(", "));

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/profile/${currentUser.uid}`);
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
          if (data.skills) {
            setSkillsString(data.skills.join(", "));
          }
        } else {
          setProfileData(prev => ({
            ...prev,
            name: currentUser.displayName || "New User",
            title: isClient ? "Web3 Project Manager" : "Full Stack Web3 Developer"
          }));
          setIsEditing(true);
        }
      } catch (err) {
        console.error("Error fetching profile", err);
        setError("Could not load profile. Ensure Postgres backend is running.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [currentUser, isClient]);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      
      const skillsArray = skillsString.split(",").map(s => s.trim()).filter(s => s !== "");
      const updatedData = { ...profileData, skills: skillsArray };

      const res = await fetch(`http://localhost:5000/api/profile/${currentUser.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
      
      if (!res.ok) throw new Error("Failed to save profile");
      
      const saved = await res.json();
      setProfileData(saved);
      setIsEditing(false);
    } catch (err) {
      setError("Failed to save profile. Make sure your Postgres backend is running.");
    } finally {
      setSaving(false);
    }
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in-up">
        <ShieldAlert className="w-16 h-16 text-black mb-4" />
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Connect Your Wallet</h2>
        <p className="text-black dark:text-slate-400">Please connect your MetaMask to view or edit your profile.</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in-up">
        <AlertCircle className="w-16 h-16 text-black mb-4" />
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Authentication Required</h2>
        <p className="text-black dark:text-slate-400">Please sign in to view and edit your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-black dark:text-slate-400 font-medium">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in-up">
      <div className="glass-card overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 w-full relative">
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={saving}
            className="absolute top-4 right-4 btn-secondary py-2 px-4 flex items-center shadow-lg disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {!saving && isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
            {isEditing ? "Save Profile" : "Edit Profile"}
          </button>
        </div>

        {error && (
          <div className="mx-8 mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl">
            {error}
          </div>
        )}

        <div className="px-8 pb-8 relative">
          <div className="relative -top-16 mb-[-3rem] flex items-end justify-between">
            <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-2xl relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 dark:from-slate-800 dark:to-slate-700 flex flex-col justify-center items-center overflow-hidden">
                <User className="w-12 h-12 text-blue-500/50" />
              </div>
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            </div>
            {!isClient && (
              <div className="flex items-center bg-blue-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-blue-100 dark:border-slate-700 shadow-sm relative bottom-4">
                <Award className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="font-semibold text-black dark:text-white pb-0.5">Top Rated</span>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-4">
            {isEditing ? (
              <div className="space-y-4 max-w-lg mb-8 animate-fade-in-up">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-slate-300 mb-1">Display Name</label>
                  <input type="text" name="name" className="input-field py-2" value={profileData.name} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-slate-300 mb-1">Title</label>
                  <input type="text" name="title" className="input-field py-2" value={profileData.title} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-slate-300 mb-1">Bio</label>
                  <textarea rows="3" name="bio" className="input-field py-2 resize-none" value={profileData.bio} onChange={handleChange}></textarea>
                </div>
                {!isClient && (
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-slate-300 mb-1">Skills (Comma separated)</label>
                    <input type="text" className="input-field py-2" value={skillsString} onChange={(e) => setSkillsString(e.target.value)} />
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-fade-in-up mt-8">
                <h1 className="text-3xl font-bold font-outfit text-black dark:text-white">
                  {profileData.name}
                  {isClient && <span className="ml-3 text-sm font-normal text-slate-500 badge bg-slate-100 dark:bg-slate-800 align-middle pb-1">Client Account</span>}
                </h1>
                <p className="text-black dark:text-slate-400 font-mono text-sm mt-1 mb-4">
                  {account}
                </p>
                <div className="text-black dark:text-slate-200 font-medium text-lg mb-4">
                  {profileData.title}
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-white/5 my-6 max-w-3xl shadow-sm">
                  <h3 className="text-sm font-bold text-black dark:text-slate-300 mb-2 uppercase tracking-wide">About</h3>
                  <p className="text-black dark:text-slate-300 leading-relaxed text-[15px]">
                    {profileData.bio}
                  </p>
                </div>
                
                {!isClient && profileData.skills && profileData.skills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-black dark:text-slate-300 mb-3 uppercase tracking-wide">Skills Set</h3>
                    <div className="flex flex-wrap gap-2">
                      {profileData.skills.map((skill, idx) => (
                        <span key={idx} className="badge bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 px-3 py-1 shadow-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
