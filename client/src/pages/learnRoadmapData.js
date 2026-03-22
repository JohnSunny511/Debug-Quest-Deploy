export const LEARNING_MODULES = [
  {
    id: "debugging-foundations",
    order: 1,
    title: "Debugging Foundations",
    duration: "15 min",
    level: "Beginner",
    goal: "Understand what debugging is and how professionals approach it.",
    highlights: [
      "Difference between guessing and evidence-based debugging",
      "Why reproducibility is the first step",
      "What makes a fix high quality in real projects",
    ],
    content: {
      overview:
        "Debugging is a repeatable engineering process: reproduce the failure, collect evidence, isolate cause, apply a minimal fix, and verify across related flows.",
      whyItMatters:
        "Teams that debug systematically ship faster with fewer regressions because fixes are based on data, not assumptions.",
      keyIdeas: [
        "Always capture expected vs actual behavior before editing code.",
        "Prefer narrow fixes that target root cause rather than broad rewrites.",
        "A debugging session should end with better tests or guardrails.",
      ],
      practice: [
        "Write one sentence bug statement with input and output.",
        "Record exact environment details (version, config, data seed).",
        "Reproduce bug twice before changing code.",
      ],
      mistakes: [
        "Editing multiple files before reproducing issue reliably.",
        "Skipping evidence collection and trusting memory.",
      ],
      quiz: [
        {
          question: "What is the first reliable debugging step?",
          answer: "Reproduce the bug consistently with clear inputs and outputs.",
        },
      ],
    },
  },
  {
    id: "bug-types-and-classification",
    order: 2,
    title: "Bug Types and Classification",
    duration: "20 min",
    level: "Beginner",
    goal: "Classify bugs correctly so you can choose the right solving method.",
    highlights: [
      "Syntax, runtime, logical, and state bugs",
      "Performance, security, and integration bugs",
      "Environment/configuration and dependency failures",
    ],
    content: {
      overview:
        "Classifying the bug early reduces wasted effort. Different bug classes require different tools and experiments.",
      whyItMatters:
        "When bug type is unclear, teams run random experiments and lose time.",
      keyIdeas: [
        "Syntax bugs fail fast during parse/compile.",
        "Runtime bugs fail during execution with stack traces.",
        "Logical bugs run successfully but produce wrong results.",
        "Integration bugs appear at boundaries between modules or services.",
        "Security bugs often involve trust, authorization, or validation failures.",
      ],
      practice: [
        "Take 5 past defects and label each by bug category.",
        "Write one expected symptom per category.",
        "Map each category to your first debugging tool.",
      ],
      mistakes: [
        "Treating all failures as logic bugs.",
        "Ignoring configuration drift between local and production.",
      ],
      quiz: [
        {
          question: "A program returns wrong output without crashing. Which category is most likely?",
          answer: "A logical bug.",
        },
      ],
    },
  },
  {
    id: "debugging-techniques",
    order: 3,
    title: "Core Debugging Techniques",
    duration: "25 min",
    level: "Beginner",
    goal: "Learn where to use logs, debugger, tests, bisect, and static analysis.",
    highlights: [
      "Log debugging and breakpoint debugging",
      "Test-driven debugging for repeatability",
      "Git bisect for regression hunting",
    ],
    content: {
      overview:
        "Each technique provides a different kind of evidence. Effective debugging combines them instead of relying on a single tool.",
      whyItMatters:
        "Technique mismatch causes slow investigation and fragile fixes.",
      keyIdeas: [
        "Logs are great for observing real execution paths.",
        "Breakpoints help inspect call stacks and local state in detail.",
        "Tests lock bug behavior and prevent regressions.",
        "Git bisect narrows a regression to the first bad commit.",
        "Linters/type checkers catch risky patterns before runtime.",
      ],
      practice: [
        "Solve one bug with logs only.",
        "Solve one bug with debugger only.",
        "Write one failing test before applying a fix.",
      ],
      mistakes: [
        "Leaving noisy temporary logs in production code.",
        "Adding many breakpoints without clear hypothesis.",
      ],
      quiz: [
        {
          question: "Which technique is best for finding first bad commit in a regression?",
          answer: "Git bisect.",
        },
      ],
    },
  },
  {
    id: "workflow-and-root-cause",
    order: 4,
    title: "Workflow and Root Cause Analysis",
    duration: "25 min",
    level: "Intermediate",
    goal: "Use a consistent workflow and root-cause methods to avoid symptom-only fixes.",
    highlights: [
      "Reproduce -> isolate -> hypothesize -> test -> fix -> verify",
      "5 Whys and timeline reconstruction",
      "Hypothesis logs for complex debugging",
    ],
    content: {
      overview:
        "Workflow reduces chaos. Root-cause analysis ensures a fix survives future change.",
      whyItMatters:
        "Without root-cause validation, the same defect usually returns in another form.",
      keyIdeas: [
        "Run one experiment at a time and record result.",
        "Ask why repeatedly until you hit process or design weakness.",
        "Use timeline reconstruction for multi-service incidents.",
      ],
      practice: [
        "Create a short hypothesis table: guess, test, result, next step.",
        "Apply 5 Whys on one recent bug.",
        "Document root cause and prevention action.",
      ],
      mistakes: [
        "Stopping after symptom disappears.",
        "Skipping post-fix verification in adjacent flows.",
      ],
      quiz: [
        {
          question: "What does root-cause analysis prevent?",
          answer: "Repeated incidents caused by fixing only surface symptoms.",
        },
      ],
    },
  },
  {
    id: "production-debugging-observability",
    order: 5,
    title: "Production Debugging and Observability",
    duration: "20 min",
    level: "Intermediate",
    goal: "Debug safely in production using telemetry instead of direct code poking.",
    highlights: [
      "Use logs, metrics, and traces together",
      "Track latency, traffic, errors, saturation",
      "Correlate incidents with deploy and config timeline",
    ],
    content: {
      overview:
        "Production debugging focuses on telemetry. You often cannot pause live systems, so diagnosis relies on observability signals.",
      whyItMatters:
        "Observability shortens mean time to detect and resolve incidents.",
      keyIdeas: [
        "Latency shows response-time behavior across percentiles.",
        "Traffic reveals load patterns and spikes.",
        "Error rate surfaces failing paths and exception classes.",
        "Saturation indicates resource pressure (CPU, memory, pools).",
      ],
      practice: [
        "Analyze one incident using logs + metrics + trace correlation.",
        "Tag deploy time in dashboards and compare before/after.",
        "Define one alert per high-impact signal.",
      ],
      mistakes: [
        "Using only logs and ignoring metrics/traces.",
        "Changing code before checking recent deploy/config changes.",
      ],
      quiz: [
        {
          question: "Which four signals are commonly used for service health?",
          answer: "Latency, traffic, errors, and saturation.",
        },
      ],
    },
  },
  {
    id: "tools-js-python",
    order: 6,
    title: "Tools for JavaScript and Python",
    duration: "20 min",
    level: "Intermediate",
    goal: "Build a practical toolchain for local and backend debugging.",
    highlights: [
      "Chrome DevTools and Node inspector",
      "pdb and faulthandler in Python",
      "Tests + linters + type checks as safety net",
    ],
    content: {
      overview:
        "Tool mastery accelerates debugging. You should know one quick workflow per language stack you use.",
      whyItMatters:
        "Faster diagnosis comes from familiarity with stack traces, breakpoints, and test harnesses.",
      keyIdeas: [
        "Use DevTools to inspect call stack, network timing, and source maps.",
        "Use `pdb` and traceback tools for Python runtime inspection.",
        "Use tests to reproduce defects and freeze expected behavior.",
        "Use lint/type checks for pre-runtime defect detection.",
      ],
      practice: [
        "Pause JS execution at a branch and inspect values.",
        "Run Python code with `pdb` and step through function flow.",
        "Create one regression test for a fixed bug.",
      ],
      mistakes: [
        "Running tests only after manual debugging is complete.",
        "Ignoring static analysis warnings that signal hidden defects.",
      ],
      quiz: [
        {
          question: "Why keep a failing test before fixing a bug?",
          answer: "It proves the bug is reproducible and prevents regression later.",
        },
      ],
    },
  },
  {
    id: "secure-and-reliable-fixes",
    order: 7,
    title: "Secure and Reliable Fixes",
    duration: "18 min",
    level: "Intermediate",
    goal: "Apply fixes that protect security and reliability, not just functionality.",
    highlights: [
      "Authorization and input validation checks",
      "Preventing data leaks and unsafe assumptions",
      "Guardrails with tests and alerts",
    ],
    content: {
      overview:
        "A fix is complete only when it also protects trust boundaries, data integrity, and long-term reliability.",
      whyItMatters:
        "Some bugs are security vulnerabilities in disguise. Functional success alone is not enough.",
      keyIdeas: [
        "Validate all untrusted input at server boundaries.",
        "Enforce authorization checks for sensitive operations.",
        "Avoid exposing sensitive internal details in errors/logs.",
        "Add monitoring and tests for security-sensitive paths.",
      ],
      practice: [
        "Review one endpoint for auth + validation gaps.",
        "Add test for unauthorized access path.",
        "Mask sensitive values in logs.",
      ],
      mistakes: [
        "Assuming frontend validation is sufficient.",
        "Logging secrets while debugging production incidents.",
      ],
      quiz: [
        {
          question: "Is frontend validation enough for security?",
          answer: "No. Server-side validation and authorization are mandatory.",
        },
      ],
    },
  },
  {
    id: "study-plan-and-checklist",
    order: 8,
    title: "Roadmap Execution and Progress Checklist",
    duration: "12 min",
    level: "Beginner",
    goal: "Turn lessons into a weekly training routine with measurable progress.",
    highlights: [
      "Weekly repetition plan",
      "Definition of done for a debugging fix",
      "Personal debugging playbook template",
    ],
    content: {
      overview:
        "Skill improves through repetition. A roadmap with completion tracking makes progress visible and consistent.",
      whyItMatters:
        "Structured repetition builds instinct faster than random practice.",
      keyIdeas: [
        "Practice one bug type per day with clear objective.",
        "Use done/not-done tracking to keep momentum.",
        "Keep a personal playbook of patterns and solutions.",
      ],
      practice: [
        "Set a 7-day debugging schedule.",
        "Track completed modules and revisit weak areas.",
        "Summarize one key lesson after every bug fix.",
      ],
      mistakes: [
        "Studying passively without hands-on bug reproduction.",
        "Skipping review of old bugs after learning new topics.",
      ],
      quiz: [
        {
          question: "What keeps debugging growth consistent over time?",
          answer: "A repeatable practice schedule with completion tracking.",
        },
      ],
    },
  },
];

export const LEARNING_REFERENCES = [
  {
    title: "MDN JavaScript Error Reference",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors",
  },
  {
    title: "Chrome DevTools JavaScript Debugging Reference",
    url: "https://developer.chrome.com/docs/devtools/javascript/reference",
  },
  {
    title: "Python faulthandler Documentation",
    url: "https://docs.python.org/3/library/faulthandler.html",
  },
  {
    title: "Git Bisect Documentation",
    url: "https://git-scm.com/docs/git-bisect",
  },
  {
    title: "Google Cloud Golden Signals Overview",
    url: "https://cloud.google.com/stackdriver/docs/observability/application-monitoring-services",
  },
  {
    title: "OWASP Top 10: Broken Access Control",
    url: "https://owasp.org/Top10/en/A01_2021-Broken_Access_Control/",
  },
  {
    title: "OpenTelemetry: What Is OpenTelemetry",
    url: "https://opentelemetry.io/docs/what-is-opentelemetry/",
  },
];

export const getModuleById = (id) =>
  LEARNING_MODULES.find((moduleItem) => moduleItem.id === id);
