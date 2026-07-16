import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-xl py-24 text-center" aria-labelledby="not-found-title">
      <p className="mb-3 text-sm font-medium text-primary-500">404</p>
      <h1 id="not-found-title" className="mb-3 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
        页面不存在
      </h1>
      <p className="mb-8 text-neutral-500 dark:text-neutral-400">
        地址可能已失效，你可以返回排行榜继续查看。
      </p>
      <Link to="/" className="btn-primary inline-flex min-h-11 items-center justify-center">
        返回排行榜
      </Link>
    </section>
  );
}
