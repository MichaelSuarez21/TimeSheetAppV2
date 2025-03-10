import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CalendarIcon, Filter, User, CheckSquare, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, subWeeks } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks';
import { supabase } from '@/lib/supabase/client';

// Define a simple user type for internal use only
interface SimpleUser {
  id: string;
  email?: string; 
  full_name?: string;
  role?: string;
}

export type DateRangeType = 'currentWeek' | 'previousWeek' | 'custom';
export type EntryTypeFilter = 'all' | 'project' | 'task';

export interface ReportFilters {
  dateRange: DateRangeType;
  startDate: Date;
  endDate: Date;
  users: string[];
  entryType: EntryTypeFilter;
  projectIds: string[];
  taskIds: string[];
  searchTerm: string;
}

interface ReportFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  className?: string;
}

export function ReportFilters({ filters, onFiltersChange, className }: ReportFiltersProps) {
  const [availableUsers, setAvailableUsers] = useState<SimpleUser[]>([]);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectFilterOpen, setIsProjectFilterOpen] = useState(false);
  const [isTaskFilterOpen, setIsTaskFilterOpen] = useState(false);
  const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  
  const debouncedProjectSearch = useDebounce(projectSearchTerm, 300);
  const debouncedTaskSearch = useDebounce(taskSearchTerm, 300);
  const debouncedUserSearch = useDebounce(userSearchTerm, 300);

  useEffect(() => {
    const fetchFilterData = async () => {
      setIsLoading(true);
      try {
        // Fetch users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, full_name, role');
        
        if (userError) throw userError;
        setAvailableUsers(userData || []);
        
        // Fetch projects
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .order('name');
          
        if (projectError) throw projectError;
        setAvailableProjects(projectData || []);
        
        // Fetch tasks
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .order('task_description');
          
        if (taskError) throw taskError;
        setAvailableTasks(taskData || []);
      } catch (error) {
        console.error('Error fetching filter data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFilterData();
  }, []);
  
  // Set the default week range if none is provided
  useEffect(() => {
    if (filters.dateRange === 'currentWeek' && (!filters.startDate || !filters.endDate)) {
      const today = new Date();
      const start = startOfWeek(today, { weekStartsOn: 0 }); // Start on Sunday
      const end = endOfWeek(today, { weekStartsOn: 0 }); // End on Saturday
      
      onFiltersChange({
        ...filters,
        startDate: start,
        endDate: end
      });
    }
  }, [filters, onFiltersChange]);

  // Handle date range changes
  const handleDateRangeChange = (range: DateRangeType) => {
    let startDate = filters.startDate;
    let endDate = filters.endDate;
    
    if (range === 'currentWeek') {
      const today = new Date();
      startDate = startOfWeek(today, { weekStartsOn: 0 }); // Start on Sunday
      endDate = endOfWeek(today, { weekStartsOn: 0 }); // End on Saturday
    } else if (range === 'previousWeek') {
      const lastWeek = subWeeks(new Date(), 1);
      startDate = startOfWeek(lastWeek, { weekStartsOn: 0 }); // Start on Sunday
      endDate = endOfWeek(lastWeek, { weekStartsOn: 0 }); // End on Saturday
    }
    
    onFiltersChange({
      ...filters,
      dateRange: range,
      startDate,
      endDate
    });
  };

  // Handle start date change
  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    onFiltersChange({
      ...filters,
      dateRange: 'custom',
      startDate: date
    });
  };

  // Handle end date change
  const handleEndDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    onFiltersChange({
      ...filters,
      dateRange: 'custom',
      endDate: date
    });
  };

  // Handle entry type change
  const handleEntryTypeChange = (type: EntryTypeFilter) => {
    onFiltersChange({
      ...filters,
      entryType: type,
      // Reset project and task filters when switching types
      projectIds: type === 'task' ? [] : filters.projectIds,
      taskIds: type === 'project' ? [] : filters.taskIds
    });
  };

  // Handle user selection
  const handleUserToggle = (userId: string) => {
    const newUsers = filters.users.includes(userId)
      ? filters.users.filter(id => id !== userId)
      : [...filters.users, userId];
    
    onFiltersChange({
      ...filters,
      users: newUsers
    });
  };

  // Handle project selection
  const handleProjectToggle = (projectId: string) => {
    const newProjects = filters.projectIds.includes(projectId)
      ? filters.projectIds.filter(id => id !== projectId)
      : [...filters.projectIds, projectId];
    
    onFiltersChange({
      ...filters,
      projectIds: newProjects
    });
  };

  // Handle task selection
  const handleTaskToggle = (taskId: string) => {
    const newTasks = filters.taskIds.includes(taskId)
      ? filters.taskIds.filter(id => id !== taskId)
      : [...filters.taskIds, taskId];
    
    onFiltersChange({
      ...filters,
      taskIds: newTasks
    });
  };

  // Handle search term change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      searchTerm: e.target.value
    });
  };

  // Filter projects by search term
  const filteredProjects = availableProjects.filter(project => 
    project.name.toLowerCase().includes(debouncedProjectSearch.toLowerCase())
  );

  // Filter tasks by search term
  const filteredTasks = availableTasks.filter(task => 
    task.task_description.toLowerCase().includes(debouncedTaskSearch.toLowerCase())
  );

  // Filter users by search term
  const filteredUsers = availableUsers.filter(user => {
    const fullName = user.full_name || '';
    const email = user.email || '';
    return fullName.toLowerCase().includes(debouncedUserSearch.toLowerCase()) || 
           email.toLowerCase().includes(debouncedUserSearch.toLowerCase());
  });

  // Get date range display
  const getDateRangeDisplay = () => {
    if (!filters.startDate || !filters.endDate) return 'Select date range';
    
    const formatStr = 'MMM d, yyyy';
    return `${format(filters.startDate, formatStr)} - ${format(filters.endDate, formatStr)}`;
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.users.length > 0) count++;
    if (filters.projectIds.length > 0) count++;
    if (filters.taskIds.length > 0) count++;
    if (filters.entryType !== 'all') count++;
    if (filters.dateRange !== 'currentWeek') count++;
    if (filters.searchTerm) count++;
    return count;
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 0 });
    const end = endOfWeek(today, { weekStartsOn: 0 });
    
    onFiltersChange({
      dateRange: 'currentWeek',
      startDate: start,
      endDate: end,
      users: [],
      entryType: 'all',
      projectIds: [],
      taskIds: [],
      searchTerm: '',
    });
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="px-4 py-3 flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <div>
            <CardTitle className="text-lg inline-flex items-center">
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2 bg-primary text-primary-foreground">{activeFilterCount}</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs mt-0">
              {filters.dateRange === 'currentWeek' && filters.startDate && filters.endDate && (
                <span>Week of {format(filters.startDate, 'MMM d')}-{format(filters.endDate, 'MMM d, yyyy')}</span>
              )}
              {filters.dateRange === 'previousWeek' && filters.startDate && filters.endDate && (
                <span>Week of {format(filters.startDate, 'MMM d')}-{format(filters.endDate, 'MMM d, yyyy')}</span>
              )}
              {filters.dateRange === 'custom' && filters.startDate && filters.endDate && (
                <span>{format(filters.startDate, 'MMM d')} - {format(filters.endDate, 'MMM d, yyyy')}</span>
              )}
            </CardDescription>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative w-64 mr-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={filters.searchTerm}
              onChange={handleSearchChange}
              className="pl-8 h-9"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                handleClearAllFilters();
              }}
            >
              Clear
            </Button>
          )}
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-3 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Range Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Date Range</Label>
            <div className="flex flex-wrap gap-2">
              <RadioGroup 
                value={filters.dateRange} 
                onValueChange={(value) => handleDateRangeChange(value as DateRangeType)}
                className="flex flex-row space-x-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="currentWeek" id="currentWeek" className="h-3.5 w-3.5" />
                  <Label htmlFor="currentWeek" className="text-xs">Current Week</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="previousWeek" id="previousWeek" className="h-3.5 w-3.5" />
                  <Label htmlFor="previousWeek" className="text-xs">Previous Week</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="custom" id="custom" className="h-3.5 w-3.5" />
                  <Label htmlFor="custom" className="text-xs">Custom</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[110px] pl-3 text-left font-normal text-xs h-8">
                    {filters.startDate ? format(filters.startDate, 'PP') : 'Start date'}
                    <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={handleStartDateChange}
                    disabled={(date) => date > new Date() || (filters.endDate ? date > filters.endDate : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-xs">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[110px] pl-3 text-left font-normal text-xs h-8">
                    {filters.endDate ? format(filters.endDate, 'PP') : 'End date'}
                    <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={handleEndDateChange}
                    disabled={(date) => date > new Date() || (filters.startDate ? date < filters.startDate : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* User Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Users</Label>
            <Popover open={isUserFilterOpen} onOpenChange={setIsUserFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs">
                  <span>
                    {filters.users.length === 0 
                      ? 'All Users' 
                      : filters.users.length === 1 
                        ? '1 User Selected' 
                        : `${filters.users.length} Users Selected`}
                  </span>
                  <User className="ml-2 h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <div className="p-3 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Input 
                      placeholder="Search users" 
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="max-h-[180px] overflow-y-auto space-y-1">
                    {filteredUsers.map(user => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`user-${user.id}`} 
                          checked={filters.users.includes(user.id)}
                          onCheckedChange={() => handleUserToggle(user.id)}
                          className="h-3.5 w-3.5"
                        />
                        <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer text-xs">
                          {user.full_name || user.email}
                        </Label>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="text-xs text-muted-foreground py-2 text-center">
                        No users found
                      </div>
                    )}
                  </div>
                  {filters.users.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-xs h-8"
                      onClick={() => onFiltersChange({ ...filters, users: [] })}
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Show selected users as badges */}
            {filters.users.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {filters.users.map(userId => {
                  const user = availableUsers.find(u => u.id === userId);
                  return (
                    <Badge key={userId} variant="secondary" className="flex items-center gap-1 text-xs py-0.5 px-2">
                      {user?.full_name || user?.email || 'Unknown User'}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleUserToggle(userId)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Entry Type + Project/Task Filters */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Entry Type</Label>
              <RadioGroup 
                value={filters.entryType} 
                onValueChange={(value) => handleEntryTypeChange(value as EntryTypeFilter)}
                className="flex flex-row space-x-3"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="all" id="all" className="h-3.5 w-3.5" />
                  <Label htmlFor="all" className="text-xs">All</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="project" id="project" className="h-3.5 w-3.5" />
                  <Label htmlFor="project" className="text-xs">Projects</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="task" id="task" className="h-3.5 w-3.5" />
                  <Label htmlFor="task" className="text-xs">Tasks</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Project Filter */}
            {(filters.entryType === 'all' || filters.entryType === 'project') && (
              <div>
                <Popover open={isProjectFilterOpen} onOpenChange={setIsProjectFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs">
                      <span>
                        {filters.projectIds.length === 0 
                          ? 'All Projects' 
                          : filters.projectIds.length === 1 
                            ? '1 Project Selected' 
                            : `${filters.projectIds.length} Projects Selected`}
                      </span>
                      <CheckSquare className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <div className="p-3 space-y-3">
                      <div className="flex items-center space-x-2">
                        <Input 
                          placeholder="Search projects" 
                          value={projectSearchTerm}
                          onChange={(e) => setProjectSearchTerm(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="max-h-[180px] overflow-y-auto space-y-1">
                        {filteredProjects.map(project => (
                          <div key={project.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`project-${project.id}`} 
                              checked={filters.projectIds.includes(project.id)}
                              onCheckedChange={() => handleProjectToggle(project.id)}
                              className="h-3.5 w-3.5"
                            />
                            <Label htmlFor={`project-${project.id}`} className="flex-1 cursor-pointer text-xs truncate">
                              {project.name}
                            </Label>
                          </div>
                        ))}
                        {filteredProjects.length === 0 && (
                          <div className="text-xs text-muted-foreground py-2 text-center">
                            No projects found
                          </div>
                        )}
                      </div>
                      {filters.projectIds.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs h-8"
                          onClick={() => onFiltersChange({ ...filters, projectIds: [] })}
                        >
                          Clear Selection
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* Show selected projects as badges */}
                {filters.projectIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {filters.projectIds.map(projectId => {
                      const project = availableProjects.find(p => p.id === projectId);
                      return (
                        <Badge key={projectId} variant="secondary" className="flex items-center gap-1 text-xs py-0.5 px-2">
                          {project?.name || 'Unknown Project'}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleProjectToggle(projectId)}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* Task Filter */}
            {(filters.entryType === 'all' || filters.entryType === 'task') && (
              <div className={cn(filters.entryType === 'all' ? "mt-2" : "")}>
                <Popover open={isTaskFilterOpen} onOpenChange={setIsTaskFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs">
                      <span>
                        {filters.taskIds.length === 0 
                          ? 'All Tasks' 
                          : filters.taskIds.length === 1 
                            ? '1 Task Selected' 
                            : `${filters.taskIds.length} Tasks Selected`}
                      </span>
                      <CheckSquare className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <div className="p-3 space-y-3">
                      <div className="flex items-center space-x-2">
                        <Input 
                          placeholder="Search tasks" 
                          value={taskSearchTerm}
                          onChange={(e) => setTaskSearchTerm(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="max-h-[180px] overflow-y-auto space-y-1">
                        {filteredTasks.map(task => (
                          <div key={task.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`task-${task.id}`} 
                              checked={filters.taskIds.includes(task.id)}
                              onCheckedChange={() => handleTaskToggle(task.id)}
                              className="h-3.5 w-3.5"
                            />
                            <Label htmlFor={`task-${task.id}`} className="flex-1 cursor-pointer text-xs truncate">
                              {task.task_description}
                            </Label>
                          </div>
                        ))}
                        {filteredTasks.length === 0 && (
                          <div className="text-xs text-muted-foreground py-2 text-center">
                            No tasks found
                          </div>
                        )}
                      </div>
                      {filters.taskIds.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs h-8"
                          onClick={() => onFiltersChange({ ...filters, taskIds: [] })}
                        >
                          Clear Selection
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* Show selected tasks as badges */}
                {filters.taskIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {filters.taskIds.map(taskId => {
                      const task = availableTasks.find(t => t.id === taskId);
                      return (
                        <Badge key={taskId} variant="secondary" className="flex items-center gap-1 text-xs py-0.5 px-2">
                          {task?.task_description || 'Unknown Task'}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleTaskToggle(taskId)}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
      {!isExpanded && (
        <CardFooter className="p-3 pt-0 flex flex-wrap gap-2">
          {/* Show active filter badges when collapsed */}
          {filters.users.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs h-6">
              <User className="h-3 w-3 mr-1" />
              {filters.users.length === 1 ? '1 User' : `${filters.users.length} Users`}
            </Badge>
          )}
          
          {filters.entryType !== 'all' && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs h-6">
              {filters.entryType === 'project' ? 'Projects Only' : 'Tasks Only'}
            </Badge>
          )}
          
          {filters.projectIds.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs h-6">
              <CheckSquare className="h-3 w-3 mr-1" />
              {filters.projectIds.length === 1 ? '1 Project' : `${filters.projectIds.length} Projects`}
            </Badge>
          )}
          
          {filters.taskIds.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs h-6">
              <CheckSquare className="h-3 w-3 mr-1" />
              {filters.taskIds.length === 1 ? '1 Task' : `${filters.taskIds.length} Tasks`}
            </Badge>
          )}
          
          {filters.dateRange !== 'currentWeek' && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs h-6">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {filters.dateRange === 'previousWeek' ? 'Previous Week' : 'Custom Date Range'}
            </Badge>
          )}
          
          {filters.searchTerm && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs h-6">
              <Search className="h-3 w-3 mr-1" />
              Search: "{filters.searchTerm.substring(0, 15)}{filters.searchTerm.length > 15 ? '...' : ''}"
            </Badge>
          )}
        </CardFooter>
      )}
    </Card>
  );
} 