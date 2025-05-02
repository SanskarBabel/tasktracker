import { PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import TaskCard from '../components/TaskCard';
import { Project, Task, TaskStatus } from '../types';
import { createTask, getProjectById, updateTaskStatus } from '../utils/api';

type TaskFormInputs = {
  title: string;
  description: string;
  status: TaskStatus;
};

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormInputs>({
    defaultValues: {
      status: TaskStatus.TODO,
    },
  });

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const data = await getProjectById(id!);
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: TaskFormInputs) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      await createTask({
        ...data,
        projectId: id,
      });
      reset();
      setIsModalOpen(false);
      fetchProject();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      fetchProject();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const groupTasksByStatus = (tasks: Task[] = []) => {
    const grouped: Record<TaskStatus, Task[]> = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.REVIEW]: [],
      [TaskStatus.COMPLETED]: [],
    };

    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-lg font-medium text-gray-900">Project not found</h3>
        <p className="mt-1 text-sm text-gray-500">The project you're looking for doesn't exist.</p>
      </div>
    );
  }

  const groupedTasks = groupTasksByStatus(project.tasks);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
          <p className="text-gray-500 mt-1">{project.description}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <h2 className="text-sm font-medium bg-gray-100 p-2 rounded-md">To Do</h2>
          {groupedTasks[TaskStatus.TODO].length === 0 ? (
            <div className="bg-white p-4 rounded-md border border-gray-200 text-center text-gray-500 text-sm">
              No tasks
            </div>
          ) : (
            <div className="space-y-2">
              {groupedTasks[TaskStatus.TODO].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleTaskStatusUpdate}
                  onTaskUpdated={fetchProject}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium bg-blue-100 p-2 rounded-md">In Progress</h2>
          {groupedTasks[TaskStatus.IN_PROGRESS].length === 0 ? (
            <div className="bg-white p-4 rounded-md border border-gray-200 text-center text-gray-500 text-sm">
              No tasks
            </div>
          ) : (
            <div className="space-y-2">
              {groupedTasks[TaskStatus.IN_PROGRESS].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleTaskStatusUpdate}
                  onTaskUpdated={fetchProject}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium bg-yellow-100 p-2 rounded-md">Review</h2>
          {groupedTasks[TaskStatus.REVIEW].length === 0 ? (
            <div className="bg-white p-4 rounded-md border border-gray-200 text-center text-gray-500 text-sm">
              No tasks
            </div>
          ) : (
            <div className="space-y-2">
              {groupedTasks[TaskStatus.REVIEW].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleTaskStatusUpdate}
                  onTaskUpdated={fetchProject}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium bg-green-100 p-2 rounded-md">Completed</h2>
          {groupedTasks[TaskStatus.COMPLETED].length === 0 ? (
            <div className="bg-white p-4 rounded-md border border-gray-200 text-center text-gray-500 text-sm">
              No tasks
            </div>
          ) : (
            <div className="space-y-2">
              {groupedTasks[TaskStatus.COMPLETED].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleTaskStatusUpdate}
                  onTaskUpdated={fetchProject}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            ></div>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Create New Task
                      </h3>
                      <div className="mt-6 space-y-6">
                        <div>
                          <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Title
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              id="title"
                              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                                errors.title ? 'border-red-500' : ''
                              }`}
                              {...register('title', {
                                required: 'Title is required',
                                minLength: {
                                  value: 3,
                                  message: 'Title must be at least 3 characters',
                                },
                              })}
                            />
                            {errors.title && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.title.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Description
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="description"
                              rows={4}
                              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                                errors.description ? 'border-red-500' : ''
                              }`}
                              {...register('description', {
                                required: 'Description is required',
                                minLength: {
                                  value: 10,
                                  message: 'Description must be at least 10 characters',
                                },
                              })}
                            ></textarea>
                            {errors.description && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.description.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="status"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Status
                          </label>
                          <div className="mt-1">
                            <select
                              id="status"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              {...register('status')}
                            >
                              {Object.values(TaskStatus).map((status) => (
                                <option key={status} value={status}>
                                  {status.replace('_', ' ')}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      'Create'
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;