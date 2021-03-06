use crate::*;
use std::io::{BufRead, BufReader};
use std::path::Path;

pub struct Zip;

impl Zip {
    pub fn extract_w_listfile(zip_file: &Path, out_dir: &Path, list_file: &Path) {
        let mut out = Command::new("7z")
            .arg("x")
            .arg(zip_file)
            .arg(format!(
                "-i@{}",
                list_file.to_str().expect("List File Path Is Invalid")
            ))
            .arg(format!(
                "-o{}",
                out_dir.to_str().expect("Out Dir Path Is Invalid")
            ))
            .arg("-bsp1")
            .stdin(Stdio::inherit())
            .stdout(Stdio::inherit())
            .spawn()
            .expect("Cant Spawn Command");

        out.wait().expect("Process Wait Error");
        //let mut sout = out.stdout.expect("stdout cant be read");
    }
    pub fn create_tree(zip_file: &Path) -> Directory {
        let child = Command::new("7z")
            .arg("l")
            .arg(zip_file)
            .stdout(Stdio::piped())
            .spawn()
            .expect("Cant Spawn Command");
        let out = child.stdout.expect("Cant Get Output");
        let reader = BufReader::new(out);
        let mut data_start = false;
        let mut dir = Directory::new("$", "$", 0);
        for line in reader.lines() {
            let line = line.expect("7z List Read Error");
            if !data_start && is_data_marker_line(&line) {
                data_start = true;
                continue;
            }
            if data_start && is_data_marker_line(&line) {
                break;
            }
            if data_start {
                let segments: Vec<&str> = line.split_whitespace().map(|s| s.trim()).collect();
                let (_, name) = line.split_at(53);
                let name = name.trim();
                /*println!(
                    "[{}] -> {}",
                    if is_data_marker_line(&line) { "x" } else { " " },
                    line
                );
                println!("=====> {:?}", segments);*/
                if segments[2].contains("D") {
                    dir.add_dir(name, name);
                } else if segments[2].contains("A") {
                    dir.add_file(name);
                } else {
                    eprintln!("\nAttribute is {}\n{}", segments[2], line);
                }
                /*if segments[2] != "D...." && segments[2] != "....A" {
                    eprintln!("Attr {} {}", segments[2], segments.last().unwrap());
                }*/
            }
        }
        dir
    }
}

fn is_data_marker_line(line: &str) -> bool {
    line.starts_with("-------")
}
