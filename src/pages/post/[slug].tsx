import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Prismic from 'prismic-javascript';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface Content {
  heading: string;
  body: {
    text: string;
  }[];
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <h1>Carregando...</h1>;
  }

  function formatDate(date: string): string {
    return format(new Date(date), 'dd MMM yyyy', { locale: ptBR });
  }

  function calcEstimated(postContent: Content[]): JSX.Element {
    const headingWords = postContent
      .map(textContent => {
        return textContent.heading.split(' ').length;
      })
      .reduce((sum, a) => sum + a, 0);

    const contentWords = postContent
      .map(bodyContent => {
        return bodyContent.body
          .map(textContent => {
            return textContent.text.split(' ').length;
          })
          .reduce((sum, a) => sum + a, 0);
      })
      .reduce((sum, a) => sum + a, 0);

    const estimatedTime = Math.ceil((contentWords + headingWords) / 200);

    return <>{estimatedTime} min</>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.fullBanner}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>

      <div className={commonStyles.wrapper}>
        <h1>{post.data.title}</h1>

        <div className={styles.postDetails}>
          <time>
            <FiCalendar /> {formatDate(post.first_publication_date)}
          </time>
          <address>
            <FiUser /> {post.data.author}
          </address>
          <span>
            <FiClock /> {calcEstimated(post.data.content)}
          </span>
        </div>

        <div className={styles.postContent}>
          {post.data.content.map(content => (
            <div className={styles.contentBlock} key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      fetch: [''],
    }
  );

  const params = response.results.map(post => {
    return { params: { slug: post.uid } };
  });

  return {
    paths: params,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body,
      })),
    },
    uid: response.uid,
  } as Post;

  return {
    props: { post },
    revalidate: 60 * 60 * 12,
  };
};
