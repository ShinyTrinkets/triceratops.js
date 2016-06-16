
## Triceratops

Each project can have only 1 entry point. The entry points are watcher modules,
like File Watcher, Site Watcher, or Time Watcher.


Modules:

* File watcher
  - 1 input folder, 1 output file stream
  - using chokidar
  - specify what files to send next: all from folder, or just the changed files
  - specify a regex filter


* Filter
  - 1 input file stream, 2 output file streams
  - filter by file name, or extension, using regular expressions


* Rename
  - 1 input file stream, 1 output file stream
  - specify how to sort files and how to rename them


* Copy
  - 1 input file stream, 2 output file streams
  - using readable & a writable streams


* Move
  - 1 input file stream, 1 output file stream


* Delete
  - 1 input file stream, no output
  - move to Trash, or delete permanently


* Compress ZLIB
  - 1 input file stream, 1 output file stream
  - compress each file separately, or everything inside an archive


* Encrypt
  - 1 input file stream, 1 output file stream
  - specify method (AES, Blowfish) and password
