jQuery Skeduler Plugin
======================
### By Oleg Mishenkin, 2016

This is [jQuery](http://jquery.com) plugin which provider you simple 
scheduler with some items on OX and 24-hours timeline on OY.

Demos
-----

The demo live in demo/ directory. Open demo/index.html directly in your web browser.

Install
-------

Install by Bower:
  > bower install jquery-skeduler

Documentation
-------------
### Basic using

The .skeduler() method can be used to create skeduler instance.
  > $('#mySkeduler').skeduler(options);

### Options description
Options contains follow fields:
  * headers: string[] - array of headers
  * tasks: Task[] - array of tasks
  * containerCssClass: string - css class of main container
  * headerContainerCssClass: string - css class of header container
  * schedulerContainerCssClass: string - css class of scheduler
  * lineHeight - height of one half-hour cell in grid
  * borderWidth - width of border of cell in grid
  * onClick - function (e, t) {} - where e - native event args and t is object of clicked card

Roadmap
-------
* [x] Initialize plugin
* [x] Add click event
* [ ] Make better documentation
