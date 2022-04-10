import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from 'prismic-javascript';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { results, next_page } = postsPagination;

  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  async function handleLoadMorePosts(next_page_link: string): Promise<void> {
    const paginationResults = await fetch(next_page_link).then(response => {
      return response.json();
    });

    const newPostList = paginationResults.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([...posts, ...newPostList]);
    setNextPage(paginationResults.next_page);
  }

  function formatDate(date: string): string {
    return format(new Date(date), 'dd MMM yyyy', { locale: ptBR });
  }

  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>

      <main className={commonStyles.wrapper}>
        <div className={styles.posts}>
          {posts.map(post => (
            <article className={styles.article} key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a title={post.data.title}>
                  <h2>{post.data.title}</h2>
                  <h3>{post.data.subtitle}</h3>
                  <div>
                    <time>
                      <FiCalendar /> {formatDate(post.first_publication_date)}
                    </time>
                    <address>
                      <FiUser /> {post.data.author}
                    </address>
                  </div>
                </a>
              </Link>
            </article>
          ))}
        </div>
        {nextPage && (
          <button
            type="submit"
            className={styles.loadMoreBtn}
            onClick={() => handleLoadMorePosts(nextPage)}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results,
        next_page: postsResponse.next_page,
      },
    },
  };
};
