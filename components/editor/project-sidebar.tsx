"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { X, Plus, Pencil, Trash2 } from "lucide-react"
import type { Project } from "@/hooks/use-project-dialogs"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: Project[]
  sharedProjects: Project[]
  onCreateProject: () => void
  onRenameProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="project-sidebar"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "fixed top-12 left-0 z-40 flex h-[calc(100vh-3rem)] w-72 flex-col border-r border-border bg-card transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">Projects</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="my-projects" className="flex h-full flex-col">
            <div className="px-3 pt-3">
              <TabsList className="w-full">
                <TabsTrigger value="my-projects" className="flex-1">
                  My Projects
                </TabsTrigger>
                <TabsTrigger value="shared" className="flex-1">
                  Shared
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="my-projects" className="flex-1 overflow-auto px-3 py-2">
              {ownedProjects.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">No projects yet</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {ownedProjects.map((project) => (
                    <li
                      key={project.id}
                      className="group flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted"
                    >
                      <span className="truncate text-sm text-foreground">
                        {project.name}
                      </span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Rename ${project.name}`}
                          onClick={() => onRenameProject(project)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Delete ${project.name}`}
                          onClick={() => onDeleteProject(project)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="shared" className="flex-1 overflow-auto px-3 py-2">
              {sharedProjects.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">No shared projects</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {sharedProjects.map((project) => (
                    <li
                      key={project.id}
                      className="rounded-lg px-2 py-1.5 hover:bg-muted"
                    >
                      <span className="text-sm text-foreground">
                        {project.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-border p-3">
          <Button className="w-full" onClick={onCreateProject}>
            <Plus />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
