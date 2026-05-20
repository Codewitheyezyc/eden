"use client";

import { useState } from "react";
import { assignFaculty } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";

export interface FacultyOption {
  id: string;
  name: string;
  slug: string;
}

const ROLES = [
  { id: "STUDENT", name: "Student", desc: "Join as a student to participate in courses and events." },
];

export function FacultySelector({ faculties }: { faculties: FacultyOption[] }) {
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyOption | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("STUDENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Faculty, Step 2: Role

  const handleSubmit = async () => {
    if (!selectedFaculty || !selectedRole) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await assignFaculty(selectedFaculty.id, selectedFaculty.slug, selectedRole);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // If successful, it redirects, so we keep loading=true to prevent double clicks
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Select Your Role
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            You are joining the <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedFaculty?.name}</span>. Please select your role below.
          </p>
        </div>

        <div className="flex justify-center w-full mb-10">
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative cursor-pointer rounded-3xl p-6 border-2 transition-all duration-300 flex flex-col items-center text-center overflow-hidden max-w-sm w-full
                  ${isSelected 
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-xl shadow-emerald-500/10 scale-105 z-10" 
                    : "border-gray-200 dark:border-white/10 bg-white/50 dark:bg-[#0a0a0a]/50 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:bg-white dark:hover:bg-[#0a0a0a]"
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-400/20 via-transparent to-transparent opacity-50 blur-xl pointer-events-none" />
                )}
                
                <h3 className={`text-xl font-bold mb-2 transition-colors duration-300
                  ${isSelected ? "text-emerald-900 dark:text-emerald-100" : "text-gray-900 dark:text-white"}
                `}>
                  {role.name}
                </h3>
                
                <p className={`text-sm transition-colors duration-300
                  ${isSelected ? "text-emerald-700 dark:text-emerald-300" : "text-gray-500 dark:text-gray-400"}
                `}>
                  {role.desc}
                </p>

                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300
                  ${isSelected ? "border-emerald-500 bg-emerald-500" : "border-gray-300 dark:border-gray-600"}
                `}>
                  {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 w-full max-w-md text-center text-sm animate-in fade-in zoom-in duration-300">
            {error}
          </div>
        )}

        <div className="flex gap-4 w-full max-w-md">
          <Button 
            variant="outline"
            size="lg" 
            className="w-1/3 h-14 rounded-2xl text-base font-bold shadow-sm"
            onClick={() => setStep(1)}
            disabled={loading}
          >
            Back
          </Button>
          <Button 
            size="lg" 
            className="w-2/3 h-14 rounded-2xl text-lg font-bold bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-xl"
            onClick={handleSubmit}
            disabled={loading || !selectedRole}
          >
            {loading ? "Saving..." : "Complete Setup"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Choose Your Path
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Welcome to Eden Academy! To personalize your experience, please select the faculty you are enrolling in.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        {faculties.map((faculty) => {
          const isSelected = selectedFaculty?.id === faculty.id;
          return (
            <div
              key={faculty.id}
              onClick={() => setSelectedFaculty(faculty)}
              className={`relative cursor-pointer rounded-3xl p-8 border-2 transition-all duration-300 flex flex-col items-center text-center overflow-hidden
                ${isSelected 
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-xl shadow-emerald-500/10 scale-105 z-10" 
                  : "border-gray-200 dark:border-white/10 bg-white/50 dark:bg-[#0a0a0a]/50 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:bg-white dark:hover:bg-[#0a0a0a]"
                }
              `}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-400/20 via-transparent to-transparent opacity-50 blur-xl pointer-events-none" />
              )}
              
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 shadow-inner
                ${isSelected ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"}
              `}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              
              <h3 className={`text-xl font-bold mb-2 transition-colors duration-300
                ${isSelected ? "text-emerald-900 dark:text-emerald-100" : "text-gray-900 dark:text-white"}
              `}>
                {faculty.name}
              </h3>
              
              <p className={`text-sm transition-colors duration-300
                ${isSelected ? "text-emerald-700 dark:text-emerald-300" : "text-gray-500 dark:text-gray-400"}
              `}>
                Join the {faculty.name} community and access specialized curriculum and resources.
              </p>
              
              <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                ${isSelected ? "bg-emerald-500 text-white opacity-100 scale-100" : "opacity-0 scale-50"}
              `}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            </div>
          )
        })}
      </div>

      <div className={`transition-all duration-500 w-full max-w-xs ${selectedFaculty ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
        <Button 
          size="lg" 
          className="w-full h-14 rounded-2xl text-lg font-bold bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-xl"
          onClick={() => setStep(2)}
          disabled={!selectedFaculty}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
