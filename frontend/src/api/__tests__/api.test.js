import assert from 'node:assert/strict';
import test from 'node:test';
import { changeQuestionDifficulty, classifyQuestion, fetchActivity, fetchClassifications, fetchDashboardOverview, fetchLeaderboard, fetchLineChart, fetchPieChart, fetchProcessingPerformance, fetchStats, generateQuestionAnswer, updateDashboardModelStatus, uploadPDF } from '../index.js';

function toRequestPath(url) {
  const parsed = new URL(String(url), 'http://localhost');
  return `${parsed.pathname}${parsed.search}`;
}

test('posts to /api/classify and maps the classification response', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const requests = [];

  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({
      difficulty: 'easy',
      confidence: 0.95,
      explanation: 'One direct arithmetic operation.',
      model: 'auto',
      provider: 'ollama',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  globalThis.window = { dispatchEvent() {} };

  try {
    const response = await classifyQuestion('What is 2 + 2?');

    assert.equal(requests.length, 1);
    assert.equal(toRequestPath(requests[0].url), '/api/classify');
    assert.equal(requests[0].options.method, 'POST');
    assert.deepEqual(JSON.parse(requests[0].options.body), {
      question: 'What is 2 + 2?',
      model: 'auto',
    });
    assert.equal(response.result.difficulty, 'Easy');
    assert.equal(response.result.conf, 95);
    assert.equal(response.result.reason, 'One direct arithmetic operation.');
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
  }
});

test('uploads PDF files as multipart form data', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ upload: { name: 'exam.pdf', questions: 3 } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const file = new File(['%PDF-test'], 'exam.pdf', { type: 'application/pdf' });
    const result = await uploadPDF(file);
    assert.equal(toRequestPath(request.url), '/api/uploads/pdf');
    assert.equal(request.options.method, 'POST');
    assert.ok(request.options.body instanceof FormData);
    assert.equal(result.upload.questions, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('maps all dashboard endpoint responses', async () => {
  const originalFetch = globalThis.fetch;
  const responses = new Map([
    ['/api/dashboard/summary', {
      totalQuestions: 4,
      totalUsers: 2,
      veryEasyCount: 1,
      easyCount: 1,
      mediumCount: 1,
      hardCount: 1,
      expertCount: 0,
      averageConfidence: 91,
    }],
    ['/api/dashboard/difficulty-distribution', {
      veryEasy: 1,
      easy: 1,
      medium: 1,
      hard: 1,
      expert: 0,
    }],
    ['/api/dashboard/question-trend?range=week', [{ date: 'Tue', value: 4 }]],
    ['/api/questions?limit=50', {
      items: [{
        id: 'q1',
        title: 'What is 2 + 2?',
        difficulty: 'easy',
        confidence: 95,
        createdAt: '2026-06-30T10:00:00.000Z',
      }],
    }],
    ['/api/dashboard/performance', {
      hasTelemetry: true,
      windowMinutes: 30,
      classification: {
        total: { averageMs: 420, p95Ms: 580, sampleCount: 5 },
        stages: [],
        llmCalls: [],
      },
      answer: {
        total: { averageMs: 980, p95Ms: 1200, sampleCount: 3 },
        stages: [],
        llmCalls: [],
      },
    }],
  ]);

  globalThis.fetch = async url => new Response(JSON.stringify(responses.get(toRequestPath(url))), {
    status: responses.has(toRequestPath(url)) ? 200 : 404,
    headers: { 'Content-Type': 'application/json' },
  });

  try {
    const [stats, pie, trend, questions, performance] = await Promise.all([
      fetchStats(),
      fetchPieChart(),
      fetchLineChart(),
      fetchClassifications(),
      fetchProcessingPerformance(),
    ]);

    assert.deepEqual(stats, {
      total: 4,
      veryEasy: 1,
      easy: 1,
      medium: 1,
      hard: 1,
      expert: 0,
      users: 2,
      accuracy: 91,
    });
    assert.equal(pie.reduce((sum, item) => sum + item.value, 0), 4);
    assert.deepEqual(trend, [{ date: 'Tue', value: 4 }]);
    assert.equal(questions[0].difficulty, 'Easy');
    assert.equal(questions[0].conf, 95);
    assert.equal(performance.classification.total.averageMs, 420);
    assert.equal(performance.answer.total.sampleCount, 3);
  } finally {
    globalThis.fetch = originalFetch;
}
});

test('loads recent activity entries', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async url => new Response(JSON.stringify({
    success: true,
    data: [{
      id: 'act1',
      actionType: 'question_classified',
      description: 'Classified a question as Medium',
      timestamp: '2026-07-02T01:00:00.000Z',
      user: {
        id: 'user1',
        name: 'Abhishek',
        avatar: null,
        initials: 'A',
      },
    }],
  }), {
    status: toRequestPath(url) === '/api/activity?limit=10' ? 200 : 404,
    headers: { 'Content-Type': 'application/json' },
  });

  try {
    const activity = await fetchActivity(10);
    assert.equal(activity.length, 1);
    assert.equal(activity[0].description, 'Classified a question as Medium');
    assert.equal(activity[0].user.initials, 'A');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('loads leaderboard entries', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async url => new Response(JSON.stringify({
    success: true,
    data: {
      items: [{
        rank: 1,
        userId: 'user1',
        name: 'Abhishek',
        avatar: null,
        initials: 'A',
        currentStreak: 3,
        longestStreak: 5,
        points: 40,
        questionsClassified: 6,
        lastActivity: '2026-07-02T01:00:00.000Z',
      }],
      currentUser: null,
      updatedAt: '2026-07-02T01:00:00.000Z',
    },
  }), {
    status: toRequestPath(url) === '/api/leaderboard?period=daily&limit=5' ? 200 : 404,
    headers: { 'Content-Type': 'application/json' },
  });

  try {
    const leaderboard = await fetchLeaderboard('daily', 5);
    assert.equal(leaderboard.items.length, 1);
    assert.equal(leaderboard.items[0].points, 40);
    assert.equal(leaderboard.updatedAt, '2026-07-02T01:00:00.000Z');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('loads dashboard overview enhancements', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async url => new Response(JSON.stringify({
    welcome: {
      greeting: 'Good Morning',
      userName: 'Abhishek',
      questionsToday: 4,
      currentStreak: 3,
      currentLevel: 2,
      goalCompleted: 6,
      goalTarget: 25,
    },
    dailyStreak: {
      current: 3,
      longest: 5,
      lastActivity: '2026-07-02T01:00:00.000Z',
      lastActivityLabel: 'Today',
      progress: 60,
    },
    weeklyGoal: {
      completed: 6,
      target: 25,
      remaining: 19,
      percentage: 24,
    },
    achievements: [],
    insights: ['Average confidence is 91% across your recent classifications.'],
    modelStatus: {
      status: 'Online',
      model: 'llama3.2',
      modelLabel: 'Llama 3.2',
      activeModel: 'llama',
      latencyMs: 620,
      averageConfidence: 91,
      requestsToday: 18,
      progress: 91,
      canSwitchModels: true,
      models: [
        { key: 'llama', label: 'Llama 3.2', model: 'llama3.2', available: true, status: 'Online', isActive: true },
        { key: 'gemma', label: 'Gemma 3 1B', model: 'gemma3:1b', available: true, status: 'Online', isActive: false },
        { key: 'nemotron', label: 'Tencent HY3', model: 'tencent/hy3:free', available: false, status: 'Offline', isActive: false },
        { key: 'groq', label: 'Groq GPT OSS 120B', model: 'openai/gpt-oss-120b', available: true, status: 'Online', isActive: false },
      ],
    },
  }), {
    status: toRequestPath(url) === '/api/dashboard/overview' ? 200 : 404,
    headers: { 'Content-Type': 'application/json' },
  });

  try {
    const overview = await fetchDashboardOverview();
    assert.equal(overview.welcome.questionsToday, 4);
    assert.equal(overview.weeklyGoal.percentage, 24);
    assert.equal(overview.modelStatus.latencyMs, 620);
    assert.equal(overview.modelStatus.models.length, 4);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('updates the active dashboard model', async () => {
  const originalFetch = globalThis.fetch;
  let request;

  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({
      success: true,
      data: {
        status: 'Online',
        model: 'gemma3:1b',
        modelLabel: 'Gemma 3 1B',
        activeModel: 'gemma',
        latencyMs: 480,
        averageConfidence: 91,
        requestsToday: 18,
        progress: 91,
        canSwitchModels: true,
        models: [],
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const data = await updateDashboardModelStatus('gemma');
    assert.equal(toRequestPath(request.url), '/api/dashboard/model-status');
    assert.equal(request.options.method, 'PATCH');
    assert.deepEqual(JSON.parse(request.options.body), { model: 'gemma' });
    assert.equal(data.activeModel, 'gemma');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('generates a detailed answer for a classified question', async () => {
  const originalFetch = globalThis.fetch;
  let request;

  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({
      success: true,
      data: {
        question: 'Explain recursion.',
        correctAnswer: 'Recursion solves a problem by calling the same function on smaller inputs.',
        stepByStepExplanation: ['Identify the base case.', 'Reduce the problem size.', 'Combine the returned results.'],
        keyConcepts: ['Base case', 'Call stack'],
        finalSummary: 'Recursion repeatedly reduces the problem until a base case stops the calls.',
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const data = await generateQuestionAnswer('Explain recursion.');
    assert.equal(toRequestPath(request.url), '/api/classify/answer');
    assert.equal(request.options.method, 'POST');
    assert.deepEqual(JSON.parse(request.options.body), {
      question: 'Explain recursion.',
      model: 'auto',
    });
    assert.equal(data.keyConcepts.length, 2);
    assert.equal(data.stepByStepExplanation[0], 'Identify the base case.');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('requests a difficulty conversion for a classified question', async () => {
  const originalFetch = globalThis.fetch;
  let request;

  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({
      success: true,
      data: {
        originalQuestion: 'Explain recursion.',
        convertedQuestion: 'Define recursion and state one base case example.',
        originalDifficulty: 'Hard',
        newDifficulty: 'Easy',
        explanation: 'The rewritten version removes multi-step reasoning and asks for a direct explanation.',
        subject: 'Computer Science',
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const data = await changeQuestionDifficulty({
      question: 'Explain recursion.',
      originalDifficulty: 'Hard',
      newDifficulty: 'Easy',
    });
    assert.equal(toRequestPath(request.url), '/api/classify/change-difficulty');
    assert.equal(request.options.method, 'POST');
    assert.deepEqual(JSON.parse(request.options.body), {
      question: 'Explain recursion.',
      originalDifficulty: 'Hard',
      newDifficulty: 'Easy',
      model: 'auto',
    });
    assert.equal(data.newDifficulty, 'Easy');
    assert.match(data.explanation, /direct explanation/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
