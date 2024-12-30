'use client';
import { useState } from "react";
import { FaFolder, FaFile, FaChevronRight, FaChevronDown } from "react-icons/fa6";

function Dashboard() {
  const [files, setFiles] = useState([
    {
      id: "1",
      name: "Documents",
      type: "folder",
      children: [
        {
          id: "2",
          name: "Resume.pdf",
          type: "file",
        },
      ],
    },
    {
      id: "3",
      name: "Images",
      type: "folder",
      children: [],
    },
  ]);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [draggedItem, setDraggedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRename = (id, updatedName) => {
    const updateName = (file) => {
      if (file.id === id) {
        return { ...file, name: updatedName };
      }
      if (file.type === "folder" && file.children) {
        return { ...file, children: file.children.map(updateName) };
      }
      return file;
    };

    setFiles((prevFiles) => prevFiles.map(updateName));
    setEditingId(null);
    setNewName("");
  };

  const handleDelete = (id) => {
    const deleteFile = (fileList) =>
      fileList.filter((file) => {
        if (file.id === id) return false;
        if (file.type === "folder" && file.children) {
          file.children = deleteFile(file.children); 
        }
        return true;
      });

    setFiles((prevFiles) => deleteFile(prevFiles)); 
    setContextMenu(null);
  };

  const handleCreate = (parentId, newItem) => {
    const addItemToFolder = (folder) => {
      if (folder.id === parentId) {
        folder.children = folder.children || [];
        folder.children.push(newItem);
      } else if (folder.type === "folder" && folder.children) {
        folder.children = folder.children.map(addItemToFolder);
      }
      return folder;
    };

    setFiles((prevFiles) =>
      prevFiles.map((file) => addItemToFolder(file))
    );
    setContextMenu(null);
  };

  const handleRightClick = (e, file) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      file,
    });
  };

  const toggleFolderExpansion = (id) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDragStart = (e, file) => {
    try {
      e.dataTransfer.setData("file", JSON.stringify(file));
      setDraggedItem(file);
    } catch (error) {
      console.error("Error serializing dragged item:", error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetFolder) => {
    e.preventDefault();

    try {
      const droppedFile = JSON.parse(e.dataTransfer.getData("file"));
      if (droppedFile && targetFolder.type === "folder" && droppedFile.id !== targetFolder.id) {
        const moveFile = (fileList) => {
          return fileList.map((file) => {
            if (file.id === droppedFile.id) {
              targetFolder.children = targetFolder.children || [];
              targetFolder.children.push(file);
              return null;
            }
            if (file.type === "folder" && file.children) {
              file.children = moveFile(file.children);
            }
            return file;
          }).filter(Boolean);
        };

        setFiles((prevFiles) => moveFile(prevFiles));
        setDraggedItem(null);
      }
    } catch (error) {
      console.error("Error parsing dropped data:", error);
    }
  };

  const filterFiles = (fileList) => {
    return fileList.filter((file) => {
      const matches = file.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (file.type === "folder" && file.children) {
        file.children = filterFiles(file.children);
        return matches || file.children.length > 0;
      }
      return matches;
    });
  };

  const renderFilesFolders = (fileList, depth = 0) => {
    return (
      <div className={`pl-[${depth * 20}px]`}>
        {fileList.map((file) => (
          <div
            key={file.id}
            onContextMenu={(e) => handleRightClick(e, file)}
            onDragStart={(e) => handleDragStart(e, file)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, file)}
            draggable
            className={`cursor-pointer mb-2 ${draggedItem?.id === file.id ? 'bg-[#f0f0f0]' : ''}`}
          >
            {file.type === "folder" ? (
              <div>
                <div className="flex items-center">
                  <FaFolder className="text-yellow-500" />
                  {editingId === file.id ? (
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={() => handleRename(file.id, newName)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(file.id, newName);
                      }}
                      autoFocus
                      className="ml-2"
                    />
                  ) : (
                    <span
                      className="ml-2"
                      onClick={() => toggleFolderExpansion(file.id)}
                    >
                      {file.name}
                    </span>
                  )}
                  <span
                    onClick={() => toggleFolderExpansion(file.id)}
                    className="ml-2"
                  >
                    {expandedFolders.has(file.id) ? (
                      <FaChevronRight className="text-gray-500" />
                    ) : (
                      <FaChevronDown className="text-gray-500" />
                    )}
                  </span>
                </div>

                {expandedFolders.has(file.id) && (
                  <div>
                    {file.children.length > 0 ? (
                      renderFilesFolders(file.children, depth + 1)
                    ) : (
                      <div className="pl-5 text-gray-500 italic">
                        This folder is empty
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center">
                <FaFile className="text-gray-400" />
                {editingId === file.id ? (
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={() => handleRename(file.id, newName)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(file.id, newName);
                    }}
                    autoFocus
                    className="ml-2"
                  />
                ) : (
                  <span className="ml-2" onClick={() => setEditingId(file.id)}>
                    {file.name}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-[14px] md:p-[30px]">
      <h1>File Explorer</h1>
      <input
        className="placeholder:pl-[10px] my-[18px] p-2 pl-[20px] w-full max-w-[400px] rounded-[24px] border border-[#dcdcdc] shadow-[0px_1px_6px_rgba(32,_33,_36,_0.2)] outline-none"
        type="text"
        placeholder="Search files and folders..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div>{renderFilesFolders(filterFiles(files))}</div>
      {contextMenu && (
        <div
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            position: "absolute",
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            padding: "10px",
            zIndex: 1000,
          }}
        >
          <div
            onClick={() => {
              handleCreate(contextMenu.file.id, {
                id: Date.now().toString(),
                name: "NewFile.txt",
                type: "file",
              });
              setContextMenu(null);
            }}
            className="cursor-pointer mb-1"
          >
            Create File
          </div>
          <div
            onClick={() => {
              handleCreate(contextMenu.file.id, {
                id: Date.now().toString(),
                name: "New Folder",
                type: "folder",
                children: [],
              });
              setContextMenu(null);
            }}
            className="cursor-pointer mb-1"
          >
            Create Folder
          </div>
          <div
            onClick={() => {
              setEditingId(contextMenu.file.id);
              setNewName(contextMenu.file.name);
              setContextMenu(null);
            }}
            className="cursor-pointer mb-1"
          >
            Rename
          </div>
          <div
            onClick={() => handleDelete(contextMenu.file.id)}
            className="cursor-pointer mb-1 text-red-500"
          >
            Delete
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;



// 'use client';
// import { useState } from "react";
// import { FaFolder, FaFile, FaChevronRight, FaChevronDown } from "react-icons/fa6";

// function Dashboard() {
//   const [files, setFiles] = useState([]); // Start with an empty files array
//   const [contextMenu, setContextMenu] = useState(null);
//   const [editingId, setEditingId] = useState(null);
//   const [newName, setNewName] = useState("");
//   const [expandedFolders, setExpandedFolders] = useState(new Set());
//   const [searchQuery, setSearchQuery] = useState("");

//   // Handle creating a file or folder dynamically
//   const handleCreate = (parentId, type) => {
//     const newId = Date.now().toString(); // Unique ID for new item
//     const newItem = {
//       id: newId,
//       name: type === "folder" ? "New Folder" : "New File",
//       type: type,
//       children: type === "folder" ? [] : undefined, // Files don't have children
//     };

//     const addItemToFolder = (folder) => {
//       if (folder.id === parentId) {
//         folder.children = folder.children || [];
//         folder.children.push(newItem);
//       } else if (folder.type === "folder" && folder.children) {
//         folder.children = folder.children.map(addItemToFolder);
//       }
//       return folder;
//     };

//     setFiles((prevFiles) =>
//       prevFiles.map((file) => addItemToFolder(file))
//     );
//     setContextMenu(null); // Close context menu after creation
//   };

//   // Handle right-click context menu
//   const handleRightClick = (e, file) => {
//     e.preventDefault();
//     setContextMenu({
//       x: e.pageX,
//       y: e.pageY,
//       file,
//     });
//   };

//   // Toggle folder expansion
//   const toggleFolderExpansion = (id) => {
//     setExpandedFolders((prev) => {
//       const newSet = new Set(prev);
//       if (newSet.has(id)) {
//         newSet.delete(id);
//       } else {
//         newSet.add(id);
//       }
//       return newSet;
//     });
//   };

//   // Filter files and folders based on search query
//   const filterFiles = (fileList) => {
//     return fileList.filter((file) => {
//       const matches = file.name.toLowerCase().includes(searchQuery.toLowerCase());
//       if (file.type === "folder" && file.children) {
//         file.children = filterFiles(file.children);
//         return matches || file.children.length > 0;
//       }
//       return matches;
//     });
//   };

//   // Recursively render files and folders
//   const renderFilesFolders = (fileList, depth = 0) => {
//     return (
//       <div className={`pl-[${depth * 20}px]`}>
//         {fileList.map((file) => (
//           <div
//             key={file.id}
//             onContextMenu={(e) => handleRightClick(e, file)}
//             className="cursor-pointer mb-2"
//           >
//             {file.type === "folder" ? (
//               <div>
//                 <div className="flex items-center">
//                   <FaFolder className="text-yellow-500" />
//                   <span
//                     className="ml-2 cursor-pointer"
//                     onClick={() => toggleFolderExpansion(file.id)}
//                   >
//                     {file.name}
//                   </span>
//                   <span
//                     onClick={() => toggleFolderExpansion(file.id)}
//                     className="ml-2"
//                   >
//                     {expandedFolders.has(file.id) ? (
//                       <FaChevronDown className="text-gray-500" />
//                     ) : (
//                       <FaChevronRight className="text-gray-500" />
//                     )}
//                   </span>
//                 </div>

//                 {expandedFolders.has(file.id) && (
//                   <div>{file.children.length > 0 ? renderFilesFolders(file.children, depth + 1) : <div className="pl-5 text-gray-500 italic">This folder is empty</div>}</div>
//                 )}
//               </div>
//             ) : (
//               <div className="flex items-center">
//                 <FaFile className="text-gray-400" />
//                 <span className="ml-2">{file.name}</span>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     );
//   };

//   return (
//     <div className="p-[14px] md:p-[30px]">
//       <h1>File Explorer</h1>
//       <input
//         className="placeholder:pl-[10px] my-[18px] p-2 pl-[20px] w-full max-w-[400px] rounded-[24px] border border-[#dcdcdc] shadow-[0px_1px_6px_rgba(32,_33,_36,_0.2)] outline-none"
//         type="text"
//         placeholder="Search files and folders..."
//         value={searchQuery}
//         onChange={(e) => setSearchQuery(e.target.value)}
//       />
//       <button
//         className="bg-blue-500 text-white px-4 py-2 rounded-lg mb-4"
//         onClick={() => {
//           setFiles((prevFiles) => [
//             ...prevFiles,
//             {
//               id: Date.now().toString(),
//               name: "Root Folder",
//               type: "folder",
//               children: [],
//             },
//           ]);
//         }}
//       >
//         Create Root Folder
//       </button>
//       <div>{renderFilesFolders(filterFiles(files))}</div>

//       {contextMenu && (
//         <div
//           style={{
//             top: contextMenu.y,
//             left: contextMenu.x,
//             position: "absolute",
//             backgroundColor: "#fff",
//             border: "1px solid #ccc",
//             padding: "10px",
//             zIndex: 1000,
//           }}
//         >
//           <div
//             onClick={() => handleCreate(contextMenu.file.id, "file")}
//             className="cursor-pointer mb-1"
//           >
//             Create File
//           </div>
//           <div
//             onClick={() => handleCreate(contextMenu.file.id, "folder")}
//             className="cursor-pointer mb-1"
//           >
//             Create Folder
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Dashboard;








