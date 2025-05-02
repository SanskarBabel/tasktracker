import { Clock, MoreVertical, Trash } from 'lucide-react';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Task, TaskStatus } from '../types';
import { deleteTask, updateTask } from '../utils/api';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onTaskUpdated: () => Promise<void>;
}

interface TaskUpdateFormInputs {
  title: string;
  description: string;
  status: TaskStatus;
}

const statusColors = {
  [TaskStatus.TODO]: 'bg-gray-100 text-gray-800',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [TaskStatus.REVIEW]: 'bg-yellow-100 text-yellow-800',
  [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800',
};

const TaskCard = ({ task, onStatusChange, onTaskUpdated }: TaskCardProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskUpdateFormInputs>({
    defaultValues: {
      title: task.title,
      description: task.description,
      status: task.status,
    },
  });

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteTask(task.id);
      onTaskUpdated();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const onSubmit: SubmitHandler<TaskUpdateFormInputs> = async (data) => {
    try {
      setIsUpdating(true);
      await updateTask(task.id, data);
      setIsEditing(false);
      onTaskUpdated();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white p-3 rounded-md shadow border border-gray-200">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                className={`block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
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
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
            </div>

            <div>
              <textarea
                rows={2}
                className={`block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : ''
                }`}
                {...register('description', {
                  required: 'Description is required',
                })}
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <select
                className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('status')}
              >
                {Object.values(TaskStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isUpdating ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 rounded-md shadow border border-gray-200">
      <div className="flex justify-between">
        <h3 className="font-medium text-gray-900 text-sm">{task.title}</h3>
        <div className="relative">
          <button
            className="text-gray-400 hover:text-gray-500"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setIsEditing(true);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{task.description}</p>

      <div className="mt-2 flex justify-between items-center">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            statusColors[task.status]
          }`}
        >
          {task.status.replace('_', ' ')}
        </span>

        <div className="flex text-xs text-gray-500 items-center">
          <Clock className="h-3 w-3 mr-1" />
          {new Date(task.createdAt).toLocaleDateString()}
        </div>
      </div>

      {task.status !== TaskStatus.COMPLETED && (
        <div className="mt-3 flex justify-end space-x-2">
          {task.status === TaskStatus.TODO && (
            <button
              onClick={() => onStatusChange(task.id, TaskStatus.IN_PROGRESS)}
              className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              Start
            </button>
          )}

          {task.status === TaskStatus.IN_PROGRESS && (
            <button
              onClick={() => onStatusChange(task.id, TaskStatus.REVIEW)}
              className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            >
              Review
            </button>
          )}

          {task.status === TaskStatus.REVIEW && (
            <button
              onClick={() => onStatusChange(task.id, TaskStatus.COMPLETED)}
              className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
            >
              Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;