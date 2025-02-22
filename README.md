# VSCode extension for Latte - Lightweight Aliasing Tracking for Java

Use our Latte type checker to annotate your programs with permissions where aliases are tracked! 
Details in our [research paper ](https://arxiv.org/pdf/2309.05637).

###  Test in Codespaces
Open a codespace from this repository and open one of the files in `latte_examples/examples`!

![Latte Extension Demo](./figs/Latte_video.gif)


Have fun!

This extension is still under development, please add an `Issue` reporting any problems you find. 

## Features

This extension type checks files using Latte.

Latte uses annotations to specify the permissions of fields and parameters to track their uniqueness properties and the aliases that are created throughout the program.

#### Quick introduction to Latte
We have 4 annotations, some for parameters, others for fields. Local variables are not annotated.
- For parameters:
  - `@Free` for parameters that are globally unique. When a caller passes an argument to a `@Free` parameter they cannot observe that value again.
  - `@Borrowed` for parameters that are unique in the callee's scope but may be stored elsewhere on the heap or stack
- For fields:
  - `@Unique` for fields that cannot be aliased with other fields.
- For both:
  - `@Shared` for parameters or fields that can be shared, so they have no uniqueness 


#### Example
Here is an example of Java classes using the annotations with comments explaining the different steps of type checking of the permissions in relation to aliasing.

```java
class Node {
    @Unique Object value;   // Field value is Unique
    @Unique Node next;      // Field next is Unique


    public Node (@Free Object value, @Free Node next) {
        // We can assign @Free objects to Unique fields given that they have no aliases
        this.value = value; 
        this.next = next;
    }
}

public class MyStack {

    @Unique Node root;          // Field root is Unique		
    
    public MyStack(@Free Node root) {
        this.root = root;       // Since root is @Free we can assign it to root:@Unique		
    }
    
    void push( @Free Object value) {	
        Node r;                 // Local variables start with a default annotation that allows
        Node n;                 // them to take the assignment's permissions
        
        r = this.root; 			// r is an alias to this.root with permission @Unique
        this.root = null; 		// Nullify this.root so there is only one pointer to the 
                                // value of the root, no other aliases
        n = new Node(value, r); // Create new root with values that have no aliases. The constructors  
                                // always return an new object that is @Free 
        this.root = n; 			// Replace root with a new value that is @Free and so can be assigned 
                                // to an @Unique field
    }
}
```

With this extension you can check in real time if your code follows the rules from latte.




## Requirements

To use Latte, your project should have the latte.jar in its dependencies and the files need to import the specifications (e.g., import specification.Free).

## Known Issues

The programs that can be verified using Latte are still simple, we are adding new features going forward.

Known issues include:
- Not supporting ifs without elses
- Not verifying aliases related to while loops
- ...

## Release Notes


### 1.0.0

Initial release of Latte


---

**Enjoy!**
