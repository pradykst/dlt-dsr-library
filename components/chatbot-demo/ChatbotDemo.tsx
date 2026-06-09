"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, StepBack, StepForward } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DemoChatPanel } from "@/components/chatbot-demo/DemoChatPanel";
import { DemoReasoningPanel } from "@/components/chatbot-demo/DemoReasoningPanel";
import { demoSteps } from "@/components/chatbot-demo/demo-data";
import { trackEvent } from "@/utils/analytics";

const finalStep = demoSteps.length - 1;

export function ChatbotDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const completedTrackedRef = useRef(false);

  useEffect(() => {
    trackEvent("chatbot_demo_opened", { route: "/chatbot-demo" });
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setCurrentStep((step) => {
        if (step >= finalStep) {
          setPlaying(false);
          return step;
        }
        return step + 1;
      });
    }, 2100);

    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (currentStep === finalStep && !completedTrackedRef.current) {
      completedTrackedRef.current = true;
      trackEvent("chatbot_demo_completed", { route: "/chatbot-demo" });
    }
  }, [currentStep]);

  function play() {
    if (currentStep >= finalStep) {
      completedTrackedRef.current = false;
      setCurrentStep(0);
    }
    setPlaying(true);
    trackEvent("chatbot_demo_played", { route: "/chatbot-demo" });
  }

  function reset() {
    setPlaying(false);
    completedTrackedRef.current = false;
    setCurrentStep(0);
  }

  function stepForward() {
    setPlaying(false);
    setCurrentStep((step) => Math.min(finalStep, step + 1));
  }

  function stepBack() {
    setPlaying(false);
    setCurrentStep((step) => Math.max(0, step - 1));
    completedTrackedRef.current = false;
  }

  return (
    <div className="space-y-6">
      <section className="research-grid border border-line bg-white px-5 py-8 shadow-research sm:px-8 lg:px-10">
        <div>
          <div>
            <Badge>Upcoming feature preview</Badge>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-tight text-ink sm:text-5xl">
              Interactive Design Knowledge Assistant
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              A preview of how researchers will move from searching the DLT library to receiving evidence-backed design guidance.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted sm:text-base">
              The assistant will retrieve reviewed design knowledge from paper-level grids and flows, ask clarifying questions, build a query-specific mini-flow, and return cited requirements, principles, features, and artifact directions.
            </p>
            <p className="mt-3 max-w-3xl border border-blue/20 bg-blue/10 px-3 py-2 text-xs font-semibold leading-5 text-blue shadow-[0_0_12px_rgba(79,111,145,0.28)]">
              This scripted demo uses preseeded example data to illustrate the planned workflow. The live chatbot is planned for launch after the conference.
            </p>
          </div>
        </div>
      </section>

      <section className="border border-line bg-white p-4 shadow-research">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Demo controls</div>
            <p className="mt-1 text-sm text-muted">Step {currentStep + 1} of {demoSteps.length}: {demoSteps[currentStep]}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={play} disabled={playing}>
              <Play className="h-4 w-4" />
              Play demo
            </Button>
            <button type="button" className="inline-flex items-center gap-2 border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-blue disabled:opacity-50" onClick={() => setPlaying(false)} disabled={!playing}>
              <Pause className="h-4 w-4" />
              Pause
            </button>
            <button type="button" className="inline-flex items-center gap-2 border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-blue" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button type="button" className="inline-flex items-center gap-2 border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-blue disabled:opacity-50" onClick={stepBack} disabled={currentStep === 0}>
              <StepBack className="h-4 w-4" />
              Step backward
            </button>
            <button type="button" className="inline-flex items-center gap-2 border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-blue disabled:opacity-50" onClick={stepForward} disabled={currentStep === finalStep}>
              <StepForward className="h-4 w-4" />
              Step forward
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,2.5fr)_minmax(320px,1fr)] items-start">
        <div className="min-w-0">
          <DemoChatPanel currentStep={currentStep} />
        </div>
        <div className="min-w-0 opacity-95 lg:text-sm">
          <DemoReasoningPanel currentStep={currentStep} />
        </div>
      </section>
    </div>
  );
}
