# latte-vscode
## VSCode extension for Latte - Lightweight Aliasing Tracking for Java
Paper [details](https://arxiv.org/pdf/2309.05637)

Use our Latte type checker to annotate your programs with permissions related to uniqueness properties where aliases are tracked!

### Annotations
We have 4 annotations, some for parameters, others for fields. Local variables are not annotated.
- For parameters:
  - `@Free` for parameters that are globally unique. When a caller passes an argument to a `@Free` parameter they cannot observe that value again.
  - `@Borrowed` for parameters that are unique in the callee's scope but may be stored elsewhere on the heap or stack
- For fields:
  - `@Unique` for fields that cannot be aliased with other fields.
- For both:
  - `@Shared` for parameters or fields that can be shared, so they have no uniqueness 


### Example
Here is an example of Java classes using Latte.

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


