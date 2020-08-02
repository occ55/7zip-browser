export class Directory {
    c_dir: Directory[] = [];
    c_file: File[] = [];
    parent: null | Directory = null;
    shown = false;
    level = 0;
    _mark = false;

    constructor(public time: Date, public name: string) {
        //
    }

    add_dir(d: Directory) {
        this.c_dir.push(d);
        d.level = this.level + 1;
        d.parent = this;
    }

    add_file(f: File) {
        this.c_file.push(f);
        f.level = this.level + 1;
        f.parent = this;
    }

    add_n_dir(time: Date, p: string): any {
        const parts = p.split("/");
        const name = parts.shift()!;
        const old = this.c_dir.find((c) => c.name === name);
        if (old && parts.length > 0) {
            return old.add_n_dir(time, parts.join("/"));
        }
        if (!old) {
            const ndir = new Directory(time, name);
            this.add_dir(ndir);
            if (parts.length > 0) {
                ndir.add_n_dir(time, parts.join("/"));
            }
        }
    }
    find_dir(p: string): Directory | null {
        const parts = p.split("/");
        const name = parts.shift()!;
        const old = this.c_dir.find((c) => c.name === name);
        if (old && parts.length > 0) {
            return old.find_dir(parts.join("/"));
        } else if (old) {
            return old;
        } else {
            return null;
        }
    }
    add_n_file(time: Date, p: string, fname: string, size: number) {
        if (p !== "") {
            this.add_n_dir(time, p);
            const dir = this.find_dir(p) as Directory;
            const nfile = new File(time, fname, size);
            dir.add_file(nfile);
        } else {
            const nfile = new File(time, fname, size);
            this.add_file(nfile);
        }
    }

    //TODO: add sorting

    to_linear(): (Directory | File)[] {
        const arr = [];
        for (const d of this.c_dir) {
            arr.push(d);
            arr.push(...d.to_linear());
        }
        arr.push(...this.c_file);
        return arr;
    }

    open() {
        this.c_dir.forEach((c) => (c.shown = true));
        this.c_file.forEach((c) => (c.shown = true));
    }
    close() {
        this.c_dir.forEach((c) => {
            c.shown = false;
            c.close();
        });
        this.c_file.forEach((c) => (c.shown = false));
    }
    toggle() {
        if (
            this.c_dir.find((c) => c.shown) ||
            this.c_file.find((c) => c.shown)
        ) {
            this.close();
        } else {
            this.open();
        }
    }

    mark() {
        this.c_dir.forEach((c) => c.mark());
        this.c_file.forEach((c) => c.mark());
    }
    unmark() {
        this.c_dir.forEach((c) => {
            c.unmark();
        });
        this.c_file.forEach((c) => c.unmark());
    }

    toggle_mark() {
        if (this._mark) {
            this.unmark();
            this._mark = false;
        } else {
            this.mark();
            this._mark = true;
        }
    }

    files_to_extract(prefix: string): string[] {
        const files = [];
        for (const f of this.c_file) {
            if (f.marked) {
                files.push(prefix + f.name);
            }
        }
        for (const d of this.c_dir) {
            files.push(...d.files_to_extract(`${d.name}/`));
        }
        return files;
    }
}

export class File {
    parent: null | Directory = null;
    shown = false;
    level = 0;
    marked = false;

    constructor(public time: Date, public name: string, public size: number) {
        //
    }

    mark() {
        this.marked = true;
    }
    unmark() {
        this.marked = false;
    }
    toggle_mark() {
        this.marked = !this.marked;
    }
}