import { configureStore } from '@reduxjs/toolkit';
import clientReducer from './clientStore';
import projectReducer from './projectStore';
import leaveReducer from './leaveStore';
import taskReducer from './taskStore';
import kanbanReducer from './kanbanStore';

export const store = configureStore({
  reducer: {
    clients: clientReducer,
    projects: projectReducer,
    leaves: leaveReducer,
    tasks: taskReducer,
    kanban: kanbanReducer,
    // Other reducers can be added here
  },
});