import { Router } from 'express';
import Post from '@/app/schemas/Post';
import AuthMiddleware from '@/app/middlewares/Auth';
import Slugify from '@/utils/Slugify';

const router = new Router();

router.get('/', (req, res) => {
  Post.find().populate('author').then(data => {
    const posts = data.map(post => { return { title: post.title, slug: post.slug, content: post.content, author: post.author } })
    res.send(posts);
  }).catch(error => {
    console.error(`Error consulting posts: ${error}`);
    res.status(400).send({ error: "Ocorreu um erro ao buscar os posts" });
  });
});

router.get('/:slugParam', (req, res) => {
  Post.findOne({ slug: req.params.slugParam }).then(data => {
    res.send(data);
  }).catch(error => {
    console.error(`Error consulting post: ${error}`);
    res.status(400).send({ error: "Ocorreu um erro ao tentar encontrar o post" });
  })
});

router.get('/u/:userId', (req, res) => {
  Post.find({ author: req.params.userId }).then(data => {
    res.send(data);
  }).catch(error => {
    console.error(`Error consulting post: ${error}`);
    res.status(400).send({ error: "Ocorreu um erro ao tentar encontrar o user" });
  })
});

router.post('/', AuthMiddleware, (req, res) => {
  const { title, content } = req.body;

  Post.create({ title, content, author: req.uid }).then(post => {
    res.status(200).send(post);
  }).catch(error => {
    console.error(`Error posting: ${error}`);
    res.status(400).send({ error: "Ocorreu um erro ao tentar realizar o post" });
  });
});

router.put('/:slugParam', AuthMiddleware, (req, res) => {
  const { title, content } = req.body;
  let slug = undefined;
  if (title) {
    slug = Slugify(title);
  }
  Post.findOneAndUpdate({ slug: req.params.slugParam }, { title, slug, content }, { new: true }).then(post => {
    res.status(200).send(post);
  }).catch(error => {
    console.error(`Error updating post: ${error}`);
    res.status(400).send({ error: "Ocorreu um erro ao atualizar o post" });
  });
});

router.delete('/:slugParam', AuthMiddleware, (req, res) => {
  Post.findOneAndRemove({ slug: req.params.slugParam }).then(() => {
    res.send({ message: "Removido com sucesso!" });
  }).catch(error => {
    console.error(`Error deleting post: ${error}`);
    res.status(400).send({ error: "Ocorreu um erro ao deletar o post" });
  });
});

export default router;