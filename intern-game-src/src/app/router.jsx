import { createBrowserRouter } from 'react-router-dom';
import PrototypeApp from './PrototypeApp';
import HomeRoute from './routes/HomeRoute';
import AdminRoute from './routes/AdminRoute';
import PresenterRoute from './routes/PresenterRoute';
import TeamRoute from './routes/TeamRoute';
import JudgeRoute from './routes/JudgeRoute';
import NotFoundRoute from './routes/NotFoundRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeRoute />,
  },
  {
    path: '/admin',
    element: <AdminRoute />,
  },
  {
    path: '/presenter',
    element: <PresenterRoute />,
  },
  {
    path: '/team/:teamId',
    element: <TeamRoute />,
  },
  {
    path: '/judge/:judgeId',
    element: <JudgeRoute />,
  },
  {
    path: '/prototype',
    element: <PrototypeApp />,
  },
  {
    path: '*',
    element: <NotFoundRoute />,
  },
]);

export default router;
