import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('页面渲染失败:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-white p-6 dark:bg-neutral-950">
          <section className="max-w-md text-center" role="alert">
            <h1 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-neutral-100">页面暂时无法显示</h1>
            <p className="mb-6 text-neutral-500 dark:text-neutral-400">请刷新页面重试；你的线上数据不会因此被修改。</p>
            <button className="btn-primary min-h-11" onClick={() => window.location.reload()}>刷新页面</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
